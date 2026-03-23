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

  // Skip auth entirely for static assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Rate limit only login
  if (pathname === "/api/auth/signin" || pathname === "/api/auth/callback/credentials") {
    if (checkRateLimit(`login:${ip}`, 20, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many auth attempts. Try again in 15 minutes." }, { status: 429 })
    }
  } else if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    if (checkRateLimit(`api:${ip}`, 300, 60 * 1000)) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 })
    }
  }

  // Skip token check for non-protected routes
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/dashboard") && !pathname.startsWith("/projects")) {
    return NextResponse.next()
  }

  // NextAuth v5 uses __Secure- prefix in production HTTPS
  const isSecure = req.url.startsWith("https://")
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token"

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName,
  })

  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/?callbackUrl=" + encodeURIComponent(pathname), req.url))
    if (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN") return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/projects")) {
    if (!token) return NextResponse.redirect(new URL("/?callbackUrl=" + encodeURIComponent(pathname), req.url))
    if (token.status === "PENDING_APPROVAL") return NextResponse.redirect(new URL("/auth/pending", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
