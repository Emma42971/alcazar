export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, {
  try {
  params }: { params: Promise<{ id: string }> }) {
    const admin = await requireAdmin()
    const { id } = await params
    const { content } = await req.json()
    const note = await prisma.investorNote.create({
      data: { userId: id, content, createdBy: admin.id }
    })
    return NextResponse.json(note)
  }
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}