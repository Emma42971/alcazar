export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { sendNdaApprovedEmail } from "@/lib/email"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { action } = await req.json()

  const nda = await prisma.ndaRequest.findUnique({
    where: { id },
    include: {
      user: { include: { profile: true } },
      project: { select: { id: true, name: true, defaultAccessDays: true } }
    }
  })
  if (!nda) return NextResponse.json({ error: "NDA not found" }, { status: 404 })

  if (action === "approve") {
    await prisma.ndaRequest.update({ where: { id }, data: { status: "APPROVED" } })

    // Accorder l'accès avec expiration optionnelle
    const expiresAt = nda.project.defaultAccessDays
      ? new Date(Date.now() + nda.project.defaultAccessDays * 86400000)
      : null

    await prisma.accessGrant.upsert({
      where: { userId_projectId: { userId: nda.userId, projectId: nda.project.id } },
      create: { userId: nda.userId, projectId: nda.project.id, expiresAt, pipelineStage: "UNDER_REVIEW" },
      update: { expiresAt, revokedAt: null },
    })

    // Email investisseur
    try {
      const firstName = nda.user.profile?.firstName ?? "Investor"
      // Serve signed NDA PDF via protected admin route
      const pdfUrl = nda.signedPdfPath
        ? `${process.env.NEXTAUTH_URL}/api/admin/nda/${nda.id}/pdf`
        : undefined
      await sendNdaApprovedEmail(nda.user.email, firstName, nda.project.name, pdfUrl)
    } catch (e) {
      console.error("Email error:", e)
    }
  } else if (action === "reject") {
    await prisma.ndaRequest.update({ where: { id }, data: { status: "REJECTED" } })
  }

  return NextResponse.json({ success: true })
}
