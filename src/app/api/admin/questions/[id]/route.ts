export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params
  const { answer } = await req.json()
  await prisma.projectQuestion.update({ where: { id }, data: { answer, answeredAt: new Date(), answeredBy: admin.id } })
  return NextResponse.json({ success: true })
}
