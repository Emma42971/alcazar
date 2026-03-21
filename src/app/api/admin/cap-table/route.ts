export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  await requireAdmin()
  const projectId = req.nextUrl.searchParams.get("projectId")
  if (!projectId) return NextResponse.json([])

  const entries = await prisma.capTableEntry.findMany({
    where: { projectId },
    include: { user: { include: { profile: true } } },
    orderBy: { amount: "desc" }
  })

  const total = entries.reduce((s, e) => s + Number(e.amount), 0)
  return NextResponse.json(entries.map(e => ({
    id: e.id,
    investorName: e.investorName,
    amount: Number(e.amount),
    percentage: total > 0 ? Math.round((Number(e.amount) / total) * 1000) / 10 : 0,
    entryType: e.entryType,
    note: e.note,
    userId: e.userId,
    createdAt: e.createdAt.toISOString(),
  })))
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const body = await req.json()
  const entry = await prisma.capTableEntry.create({
    data: {
      projectId: body.projectId,
      userId: body.userId || null,
      investorName: body.investorName,
      amount: BigInt(body.amount),
      entryType: body.entryType ?? "EQUITY",
      note: body.note || null,
    }
  })
  return NextResponse.json({ ...entry, amount: Number(entry.amount) })
}
