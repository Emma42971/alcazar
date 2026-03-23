import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

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
  const ip = req.headers.get("x-real-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown"

  // Rate limiting — exclure /api/auth/session et /api/auth/csrf (appelés automatiquement)
  if (pathname === "/api/auth/signin" || pathname === "/api/auth/callback/credentials") {
    if (checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many auth attempts. Try again in 15 minutes." },
        { status: 429, headers: { "Retry-After": "900" } }
      )
    }
  } else if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    if (checkRateLimit(`api:${ip}`, 200, 60 * 1000)) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 })
    }
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET })

  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/?callbackUrl=" + encodeURIComponent(pathname), req.url))
    if (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN") return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/projects")) {
    if (!token) return NextResponse.redirect(new URL("/?callbackUrl=" + encodeURIComponent(pathname), req.url))
    if (token.status === "PENDING_APPROVAL") return NextResponse.redirect(new URL("/auth/pending", req.url))
  }

  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
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
