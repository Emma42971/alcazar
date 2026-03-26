import { prisma } from "@/lib/prisma"

type AuditAction =
  | "LOGIN" | "LOGOUT" | "REGISTER"
  | "NDA_SIGNED" | "NDA_APPROVED" | "NDA_REJECTED"
  | "ACCESS_GRANTED" | "ACCESS_REVOKED"
  | "DOCUMENT_VIEWED" | "DOCUMENT_DOWNLOADED"
  | "KYC_SUBMITTED" | "KYC_APPROVED" | "KYC_REJECTED"
  | "ESIGN_REQUESTED" | "ESIGN_COMPLETED"
  | "INVESTOR_APPROVED" | "INVESTOR_REJECTED"
  | "PROJECT_CREATED" | "PROJECT_UPDATED"
  | "DOCUMENT_UPLOADED" | "DOCUMENT_DELETED"
  | "WORKFLOW_FIRED"
  | "BULK_EMAIL_SENT"
  | "ADMIN_ACTION"

export async function auditLog({
  action, userId, targetId, targetType, details, ip, userAgent
}: {
  action: AuditAction
  userId?: string
  targetId?: string
  targetType?: string
  details?: Record<string, any>
  ip?: string
  userAgent?: string
}) {
  try {
    await prisma.auditEntry.create({
      data: {
        action,
        userId:     userId ?? null,
        targetId:   targetId ?? null,
        targetType: targetType ?? null,
        details:    details ? JSON.stringify(details) : null,
        ipHash:     ip ? hashIp(ip) : null,
        userAgent:  userAgent?.slice(0, 500) ?? null,
      }
    })
  } catch (e) {
    // Audit log must never break the app
    console.error("Audit log error:", e)
  }
}

function hashIp(ip: string): string {
  // Simple hash for privacy (not reversible)
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}
