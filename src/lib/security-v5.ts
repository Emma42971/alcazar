import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

// Device fingerprint from request headers
export function getDeviceFingerprint(req: NextRequest): string {
  const ua = req.headers.get("user-agent") ?? ""
  const lang = req.headers.get("accept-language") ?? ""
  const encoding = req.headers.get("accept-encoding") ?? ""
  const raw = `${ua}|${lang}|${encoding}`
  // Simple hash
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown"
}

// Check if IP is allowed for a project
export async function checkProjectIpAccess(projectId: string, ip: string): Promise<boolean> {
  const config = await prisma.projectSecurityConfig.findUnique({
    where: { projectId }
  })
  if (!config) return true

  // Check blacklist first
  if (config.ipBlacklist) {
    const blacklist = config.ipBlacklist as string[]
    if (blacklist.some(blocked => ip.startsWith(blocked))) return false
  }

  // Check whitelist (if defined, only allow listed IPs)
  if (config.ipWhitelist) {
    const whitelist = config.ipWhitelist as string[]
    if (whitelist.length > 0) {
      return whitelist.some(allowed => ip.startsWith(allowed))
    }
  }

  return true
}

// Check document access rule
export async function checkDocumentAccess(
  documentId: string,
  userId: string,
  ip: string
): Promise<{ allowed: boolean; level: string; fenceView: boolean; reason?: string }> {
  const rule = await prisma.documentAccessRule.findUnique({
    where: { documentId }
  })

  if (!rule) return { allowed: true, level: "DOWNLOAD_ORIGINAL", fenceView: false }

  // Time-based access
  const now = new Date()
  if (rule.accessStartAt && now < rule.accessStartAt) {
    return { allowed: false, level: "NONE", fenceView: false, reason: "Access not yet available" }
  }
  if (rule.accessEndAt && now > rule.accessEndAt) {
    return { allowed: false, level: "NONE", fenceView: false, reason: "Access has expired" }
  }

  // IP check
  if (rule.allowedIps) {
    const allowedIps = rule.allowedIps as string[]
    if (allowedIps.length > 0 && !allowedIps.some(allowed => ip.startsWith(allowed))) {
      return { allowed: false, level: "NONE", fenceView: false, reason: "IP not allowed" }
    }
  }

  // Max views check
  if (rule.maxViews) {
    const viewCount = await prisma.documentActivity.count({
      where: { documentId, userId, event: "open" }
    })
    if (viewCount >= rule.maxViews) {
      return { allowed: false, level: "NONE", fenceView: false, reason: "Max views reached" }
    }
  }

  return {
    allowed: rule.permissionLevel !== "NONE",
    level: rule.permissionLevel,
    fenceView: rule.enableFenceView,
  }
}

// Log security event
export async function logSecurityEvent({
  type, userId, tenantId, ip, userAgent, details, severity = "info"
}: {
  type: string
  userId?: string
  tenantId?: string
  ip?: string
  userAgent?: string
  details?: Record<string, any>
  severity?: string
}) {
  try {
    await prisma.securityEvent.create({
      data: {
        type: type as any,
        userId: userId ?? null,
        tenantId: tenantId ?? null,
        ipHash: ip ? hashIp(ip) : null,
        userAgent: userAgent?.slice(0, 500),
        details: details ?? null,
        severity,
      }
    })
  } catch (e) {
    console.error("Security event log error:", e)
  }
}

function hashIp(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}
