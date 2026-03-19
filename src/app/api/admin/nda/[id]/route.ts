export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { action } = await req.json()
  if (!["approve","reject"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  const nda = await prisma.ndaRequest.findUnique({ where: { id }, include: { user: { include: { profile: true } }, project: true } })
  if (!nda) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const status = action === "approve" ? "APPROVED" : "REJECTED"
  await prisma.ndaRequest.update({ where: { id }, data: { status } })
  if (action === "approve") {
    await prisma.accessGrant.upsert({ where: { userId_projectId: { userId: nda.userId, projectId: nda.projectId } }, update: {}, create: { userId: nda.userId, projectId: nda.projectId } })
    const name = nda.user.profile ? `${nda.user.profile.firstName} ${nda.user.profile.lastName}` : nda.user.email
    await sendEmail({ type: "nda-approved", name, email: nda.user.email, project: nda.project.name })
  }
  return NextResponse.json({ success: true })
}
