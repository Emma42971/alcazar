export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const body = await req.json()
  const item = await prisma.ddChecklistItem.update({ where: { id }, data: { documentId: body.documentId ?? null, name: body.name, description: body.description } })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  await prisma.ddChecklistItem.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
