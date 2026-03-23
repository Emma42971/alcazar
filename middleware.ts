import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// In-memory rate limiter (Edge Runtime compatible)
const store = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const record = store.get(key)
  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  record.count++
  return record.count > max
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

  // Rate limiting
  if (pathname.startsWith("/api/auth")) {
    if (checkRateLimit(`auth:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many auth attempts. Try again in 15 minutes." },
        { status: 429, headers: { "Retry-After": "900" } }
      )
    }
  } else if (pathname.startsWith("/api/")) {
    if (checkRateLimit(`api:${ip}`, 100, 60 * 1000)) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 })
    }
  }

  // Use getToken instead of auth() — Edge Runtime compatible, no Prisma
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  })

  // Admin protection
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/?callbackUrl=" + encodeURIComponent(pathname), req.url))
    }
    if (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  // Investor protection
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/projects")) {
    if (!token) {
      return NextResponse.redirect(new URL("/?callbackUrl=" + encodeURIComponent(pathname), req.url))
    }
    if (token.status === "PENDING_APPROVAL") {
      return NextResponse.redirect(new URL("/auth/pending", req.url))
    }
  }

  // Security headers
  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  return response
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/projects/:path*",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
