export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
export async function POST(req: NextRequest) {
  await requireAdmin()
  const data = await req.json()
  if (!data.slug) data.slug = slugify(data.name)
  const project = await prisma.project.create({ data })
  return NextResponse.json({ success: true, project })
}
export async function PATCH(req: NextRequest) {
  await requireAdmin()
  const { id, ...data } = await req.json()
  const project = await prisma.project.update({ where: { id }, data })
  return NextResponse.json({ success: true, project })
}
