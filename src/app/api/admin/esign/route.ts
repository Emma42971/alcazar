export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { documentId, projectId, recipientId, message, expiresInDays } = await req.json()

  const req2 = await prisma.eSignatureRequest.create({
    data: {
      documentId, projectId, recipientId, message,
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null,
    },
    include: { document: { select: { name: true } } }
  })

  await createNotification({
    userId: recipientId,
    type: "ESIGN_REQUEST",
    title: "Signature required",
    body: `Please sign: ${req2.document.name}`,
    link: `/esign/${req2.id}`
  })

  return NextResponse.json(req2)
}
