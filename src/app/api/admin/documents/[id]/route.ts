export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  await prisma.document.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const body = await req.json()
  const doc = await prisma.document.update({
    where: { id },
    data: {
      status: body.status,
      label:  body.label,
      internalNote: body.internalNote,
      folderId: body.folderId,
      publishedAt: body.status === "PUBLISHED" ? new Date() : undefined,
    }
  })
  return NextResponse.json(doc)
}
