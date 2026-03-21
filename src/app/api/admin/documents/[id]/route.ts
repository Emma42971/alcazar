export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  await prisma.documentActivity.deleteMany({ where: { documentId: id } })
  await prisma.document.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
