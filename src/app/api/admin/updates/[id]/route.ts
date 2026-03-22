export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id: projectId } = await params
  const { title, content, isPublic } = await req.json()
  const update = await prisma.projectUpdate.create({
    data: { projectId, title, content, isPublic: isPublic ?? true }
  })
  return NextResponse.json({ ...update, createdAt: update.createdAt.toISOString(), updatedAt: update.updatedAt.toISOString() })
}
