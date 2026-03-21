import { NextRequest, NextResponse } from "next/server"

// Simple in-memory rate limiter
// For production scale: use Redis with rate-limiter-flexible
const store = new Map<string, { count: number; resetAt: number }>()

interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
}

export function rateLimit(config: RateLimitConfig) {
  return function check(req: NextRequest): NextResponse | null {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown"

    const key = `${ip}:${req.nextUrl.pathname}`
    const now = Date.now()

    const record = store.get(key)
    if (!record || now > record.resetAt) {
      store.set(key, { count: 1, resetAt: now + config.windowMs })
      return null
    }

    record.count++
    if (record.count > config.max) {
      return NextResponse.json(
        { error: config.message ?? "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)),
            "X-RateLimit-Limit": String(config.max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(record.resetAt),
          }
        }
      )
    }

    return null
  }
}

// Pre-configured limiters
export const authLimiter    = rateLimit({ windowMs: 15 * 60 * 1000, max: 10,  message: "Too many auth attempts. Try again in 15 minutes." })
export const apiLimiter     = rateLimit({ windowMs: 60 * 1000,       max: 100, message: "Rate limit exceeded." })
export const uploadLimiter  = rateLimit({ windowMs: 60 * 60 * 1000,  max: 20,  message: "Upload limit exceeded. Try again in 1 hour." })

// Cleanup old entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of store.entries()) {
      if (now > val.resetAt) store.delete(key)
    }
  }, 5 * 60 * 1000)
}
