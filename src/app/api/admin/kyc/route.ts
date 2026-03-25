export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

export async function GET() {
  try {
    await requireAdmin()
    const docs = await prisma.kycDocument.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(docs.map(d => ({
      id: d.id,
      userId: d.userId,
      docType: d.docType,
      filePath: d.filePath,
      fileName: d.fileName,
      status: d.status,
      adminNote: d.adminNote,
      createdAt: d.createdAt.toISOString(),
      reviewedAt: d.reviewedAt?.toISOString() ?? null,
      name: d.user.profile
        ? `${d.user.profile?.firstName} ${d.user.profile?.lastName}`
        : d.user.email,
      email: d.user.email,
    })))
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    const { id, action, adminNote } = await req.json()
    const status = action === "approve" ? "APPROVED" : "REJECTED"

    const doc = await prisma.kycDocument.update({
      where: { id },
      data: {
        status: status as any,
        adminNote: adminNote ?? null,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    })

    await createNotification({
      userId: doc.userId,
      type: status === "APPROVED" ? "KYC_APPROVED" : "KYC_REJECTED",
      title: `KYC ${status === "APPROVED" ? "Approved" : "Rejected"}`,
      body: adminNote ?? (status === "APPROVED"
        ? "Your identity has been verified."
        : "Your KYC submission was rejected."),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
