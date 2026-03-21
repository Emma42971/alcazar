export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { signatureData, signatureType, action } = await req.json()
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

  const esign = await prisma.eSignatureRequest.findUnique({
    where: { id },
    include: { document: { select: { name: true } }, project: { select: { name: true } } }
  })
  if (!esign || esign.recipientId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (action === "sign") {
    await prisma.eSignatureRequest.update({
      where: { id },
      data: { status: "SIGNED", signatureData, signatureType, signerIp: ip, signedAt: new Date() }
    })
    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
    for (const a of admins) {
      await createNotification({
        userId: a.id, type: "ESIGN_COMPLETED",
        title: `Document signed — ${esign.document.name}`,
        body: `${esign.project.name} · Signed by investor`,
        link: `/admin/investors`
      })
    }
  } else if (action === "decline") {
    await prisma.eSignatureRequest.update({ where: { id }, data: { status: "DECLINED" } })
  }

  return NextResponse.json({ success: true })
}
