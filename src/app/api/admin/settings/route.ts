export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
export async function PATCH(req: NextRequest) {
  try {
  await requireAdmin()
    const { key, value } = await req.json()
    const setting = await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
    return NextResponse.json({ success: true, setting })
  }
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}