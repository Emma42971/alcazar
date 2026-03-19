import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
export async function PATCH(req: NextRequest) {
  await requireAdmin()
  const { key, value } = await req.json()
  const setting = await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
  return NextResponse.json({ success: true, setting })
}
