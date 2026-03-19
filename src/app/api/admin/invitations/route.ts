import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  const { userId, projectId, action } = await req.json()
  if (action === "grant") {
    await prisma.accessGrant.upsert({ where: { userId_projectId: { userId, projectId } }, update: {}, create: { userId, projectId } })
    await prisma.projectInvitation.upsert({ where: { userId_projectId: { userId, projectId } }, update: {}, create: { userId, projectId, invitedById: admin.id } })
    return NextResponse.json({ success: true })
  }
  if (action === "revoke") {
    await prisma.accessGrant.deleteMany({ where: { userId, projectId } })
    await prisma.projectInvitation.deleteMany({ where: { userId, projectId } })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
