import { auth } from "@/auth"
import { NextResponse } from "next/server"

const rateLimitMap = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

export default auth((req) => {
  const { nextUrl } = req
  const session = (req as any).auth
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"

  // Rate limit auth & API routes
  const sensitive = ["/api/auth/signin", "/api/auth/register", "/api/auth/send-otp"]
  if (sensitive.some((r) => nextUrl.pathname.startsWith(r))) {
    if (!rateLimit(ip, 20)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }
  }

  const isLoggedIn  = !!session?.user
  const isAdmin     = session?.user?.role === "ADMIN"
  const isApproved  = session?.user?.status === "APPROVED"
  const needs2fa    = session?.user?.needs2fa === true

  const isAdminRoute     = nextUrl.pathname.startsWith("/admin")
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard")
  const isAuthPage       = nextUrl.pathname === "/" ||
                           nextUrl.pathname.startsWith("/auth/")

  // Rediriger si besoin 2FA
  if (isLoggedIn && needs2fa && nextUrl.pathname !== "/auth/verify-otp") {
    return NextResponse.redirect(new URL("/auth/verify-otp", req.url))
  }

  // Rediriger si déjà connecté vers les bonnes routes
  if (isLoggedIn && !needs2fa && isAuthPage) {
    return NextResponse.redirect(
      new URL(isAdmin ? "/admin" : "/dashboard", req.url)
    )
  }

  // Protéger admin
  if (isAdminRoute) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/", req.url))
    if (!isAdmin)    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Protéger dashboard
  if (isDashboardRoute) {
    if (!isLoggedIn)  return NextResponse.redirect(new URL("/", req.url))
    if (!isApproved && !isAdmin) {
      return NextResponse.redirect(new URL("/auth/pending", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
