export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { investmentId, amount, currency, type, period, notes } = await req.json()
    const investment = await prisma.investment.findUnique({ where: { id: investmentId } })
    if (!investment) return NextResponse.json({ error: "Investment not found" }, { status: 404 })
    const distribution = await prisma.distribution.create({
      data: {
        investmentId,
        tenantId: investment.tenantId,
        investorId: investment.investorId,
        amount: parseFloat(amount),
        currency: currency ?? "USD",
        type: type ?? "DIVIDEND",
        status: "SCHEDULED",
        period: period ?? null,
        notes: notes ?? null,
      }
    })
    await createNotification({
      userId: investment.investorId,
      type: "ACCESS_GRANTED",
      title: `Distribution scheduled — ${currency ?? "USD"} ${amount}`,
      body: `A ${type ?? "dividend"} distribution has been scheduled for ${period ?? "this period"}.`,
    })
    return NextResponse.json(distribution)
  } catch (e: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const investorId = req.nextUrl.searchParams.get("investorId")
    const where: any = {}
    if (investorId) where.investorId = investorId
    const distributions = await prisma.distribution.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    return NextResponse.json(distributions.map(d => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      paidAt: d.paidAt?.toISOString() ?? null
    })))
  } catch (e: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
