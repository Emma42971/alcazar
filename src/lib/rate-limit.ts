import { NextRequest, NextResponse } from "next/server"

const store = new Map<string, { count: number; resetAt: number }>()

interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
}

function getClientIp(req: NextRequest): string {
  // Nginx Proxy Manager passe l'IP réelle dans X-Real-IP
  // X-Forwarded-For peut contenir plusieurs IPs séparées par virgule
  const realIp = req.headers.get("x-real-ip")
  if (realIp && realIp !== "unknown") return realIp

  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    // Prendre la première IP non-privée de la liste
    const ips = forwarded.split(",").map(s => s.trim())
    const publicIp = ips.find(ip =>
      !ip.startsWith("10.") &&
      !ip.startsWith("172.") &&
      !ip.startsWith("192.168.") &&
      !ip.startsWith("127.") &&
      ip !== "::1"
    )
    if (publicIp) return publicIp
    return ips[0] ?? "unknown"
  }

  return "unknown"
}

export function rateLimit(config: RateLimitConfig) {
  return function check(req: NextRequest): NextResponse | null {
    const ip  = getClientIp(req)
    const key = `${ip}:${req.nextUrl.pathname}`
    const now = Date.now()

    const record = store.get(key)
    if (!record || now > record.resetAt) {
      store.set(key, { count: 1, resetAt: now + config.windowMs })
      return null
    }

    record.count++
    if (record.count > config.max) {
      const retryAfterSecs = Math.ceil((record.resetAt - now) / 1000)
      const retryMins = Math.ceil(retryAfterSecs / 60)
      const message = config.message
        ?.replace("{mins}", String(retryMins))
        ?? `Too many requests. Try again in ${retryMins} minute(s).`

      return NextResponse.json(
        { error: message },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSecs),
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

// Auth login — strict : 10 tentatives / 15 min
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Try again in {mins} minutes.",
})

// Register — plus souple : 5 inscriptions / heure par IP (un utilisateur ne s'inscrit qu'une fois)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many registration attempts from this IP. Try again in {mins} minutes.",
})

// API générale
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Rate limit exceeded. Try again later.",
})

// Upload
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: "Upload limit reached. Try again in {mins} minutes.",
})

// Cleanup
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of store.entries()) {
      if (now > val.resetAt) store.delete(key)
    }
  }, 5 * 60 * 1000)
}
