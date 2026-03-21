import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { authLimiter, apiLimiter } from "@/lib/rate-limit"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Rate limiting
  if (pathname.startsWith("/api/auth")) {
    const limited = authLimiter(req)
    if (limited) return limited
  } else if (pathname.startsWith("/api/")) {
    const limited = apiLimiter(req)
    if (limited) return limited
  }

  // 2. Auth protection
  const session = await auth()

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/?callbackUrl=" + encodeURIComponent(pathname), req.url))
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  // Investor protected routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/projects")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/?callbackUrl=" + encodeURIComponent(pathname), req.url))
    }
    if (session.user.status === "PENDING_APPROVAL") {
      return NextResponse.redirect(new URL("/auth/pending", req.url))
    }
  }

  // 3. Security headers on all responses
  const response = NextResponse.next()

  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  }

  return response
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/projects/:path*",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
