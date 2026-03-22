import { prisma } from "@/lib/prisma"
import { pushEvent } from "@/app/api/events/route"

type NotifType = "NDA_SUBMITTED" | "NDA_APPROVED" | "NDA_REJECTED" | "ACCESS_GRANTED" |
  "ACCESS_REVOKED" | "NEW_DOCUMENT" | "QA_ANSWERED" | "NEW_MESSAGE" |
  "KYC_APPROVED" | "KYC_REJECTED" | "ESIGN_REQUESTED" | "ESIGN_COMPLETED" | "WORKFLOW_TRIGGERED"

export async function createNotification({
  userId, type, title, body, link
}: { userId: string; type: NotifType; title: string; body: string; link?: string }) {
  const notif = await prisma.notification.create({
    data: { userId, type, title, body, link: link ?? null }
  })
  // Push via SSE
  pushEvent(userId, { type: "notification", data: notif })
  return notif
}
