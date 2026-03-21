export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params
  const { status, adminNote } = await req.json()

  const doc = await prisma.kycDocument.update({
    where: { id },
    data: { status, adminNote, reviewedAt: new Date(), reviewedBy: admin.id }
  })

  // Update investor profile KYC status
  await prisma.investorProfile.updateMany({
    where: { userId: doc.userId },
    data: { kycStatus: status }
  })

  // Notify investor
  await createNotification({
    userId: doc.userId,
    type: status === "APPROVED" ? "KYC_APPROVED" : "KYC_REJECTED",
    title: status === "APPROVED" ? "KYC Approved ✅" : "KYC Rejected ❌",
    body: status === "APPROVED" ? "Your identity has been verified." : `Reason: ${adminNote ?? "Please resubmit."}`,
    link: "/profile"
  })

  return NextResponse.json({ success: true })
}
