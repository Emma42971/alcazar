export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  await requireAdmin()
  const projectId = req.nextUrl.searchParams.get("projectId")
  if (!projectId) return NextResponse.json([])
  const entries = await prisma.capTableEntry.findMany({
    where: { projectId }, orderBy: { amount: "desc" }
  })
  return NextResponse.json(entries.map(e => ({ ...e, amount: Number(e.amount) })))
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { projectId, investorName, amount, entryType, note } = await req.json()
  const entry = await prisma.capTableEntry.create({
    data: { projectId, investorName, amount: BigInt(amount), entryType: entryType ?? "EQUITY", note: note ?? null }
  })
  return NextResponse.json({ ...entry, amount: Number(entry.amount) })
}

export async function DELETE(req: NextRequest) {
  await requireAdmin()
  const { id } = await req.json()
  await prisma.capTableEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
