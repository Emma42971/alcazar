export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const body = await req.json()

  const update: any = { ...body }
  if (body.status === "ACTIVE" && !body.publishedAt) {
    update.publishedAt = new Date()
  }

  const listing = await prisma.listing.update({
    where: { id },
    data: update,
  })
  return NextResponse.json({ ...listing, publishedAt: listing.publishedAt?.toISOString() ?? null, createdAt: listing.createdAt.toISOString(), updatedAt: listing.updatedAt.toISOString() })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  await prisma.listing.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
