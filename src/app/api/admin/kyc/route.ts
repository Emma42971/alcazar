export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

export async function GET() {
  await requireAdmin()
  const records = await prisma.kycRecord.findMany({
    include: { user: { include: { profile: true } } },
    orderBy: { submittedAt: "desc" },
  })
  return NextResponse.json(records.map(k => ({
    id: k.id, userId: k.userId, status: k.status,
    idDocPath: k.idDocPath, idDocType: k.idDocType,
    addressDocPath: k.addressDocPath, reviewNote: k.reviewNote,
    submittedAt: k.submittedAt?.toISOString() ?? null,
    reviewedAt: k.reviewedAt?.toISOString() ?? null,
    name: k.user.profile ? `${k.user.profile.firstName} ${k.user.profile.lastName}` : k.user.email,
    email: k.user.email,
  })))
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  const { id, action, reviewNote } = await req.json()
  const status = action === "approve" ? "APPROVED" : "REJECTED"
  const record = await prisma.kycRecord.update({
    where: { id },
    data: { status, reviewNote, reviewedBy: admin.id, reviewedAt: new Date() },
  })
  await createNotification({
    userId: record.userId,
    type: status === "APPROVED" ? "KYC_APPROVED" : "KYC_REJECTED",
    title: `KYC ${status === "APPROVED" ? "Approved" : "Rejected"}`,
    body: reviewNote ?? (status === "APPROVED" ? "Your identity has been verified." : "Your KYC submission was rejected."),
  })
  return NextResponse.json({ success: true })
}
