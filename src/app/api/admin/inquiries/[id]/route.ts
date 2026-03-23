export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { status, adminNote } = await req.json()
  await prisma.contactInquiry.update({ where: { id }, data: { status, adminNote: adminNote ?? null } })
  return NextResponse.json({ success: true })
}
