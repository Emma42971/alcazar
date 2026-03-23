export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { projectId, name, description } = await req.json()
  const count = await prisma.ddChecklistItem.count({ where: { projectId } })
  const item = await prisma.ddChecklistItem.create({ data: { projectId, name, description, sortOrder: count } })
  return NextResponse.json(item)
}
