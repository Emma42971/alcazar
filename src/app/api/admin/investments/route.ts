export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { auditLog } from "@/lib/audit"
import { createNotification } from "@/lib/notifications"

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  const projectId = req.nextUrl.searchParams.get("projectId")
  const where: any = {}
  if (projectId) where.projectId = projectId

  const investments = await prisma.investment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      distributions: { select: { id: true, amount: true, status: true, type: true } }
    }
  })
  return NextResponse.json(investments.map(i => ({
    ...i,
    amount: Number(i.amount),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    confirmedAt: i.confirmedAt?.toISOString() ?? null,
  })))
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  const body = await req.json()
  const { projectId, investorId, amount, currency, wireReference, notes, equity, shareCount, sharePrice } = body

  const amountUsd = currency === "USD" ? amount
    : currency === "AED" ? amount / 3.67
    : currency === "EUR" ? amount * 1.08
    : amount

  const investment = await prisma.investment.create({
    data: {
      tenantId: body.tenantId ?? "",
      projectId, investorId,
      amount: BigInt(Math.round(amount)),
      currency: currency ?? "USD",
      amountUsd,
      wireReference: wireReference ?? null,
      notes: notes ?? null,
      equity: equity ?? null,
      shareCount: shareCount ?? null,
      sharePrice: sharePrice ?? null,
    }
  })

  await auditLog({ action: "ADMIN_ACTION", userId: admin.id, targetId: investment.id, targetType: "Investment", details: { action: "create", amount, currency } })

  return NextResponse.json({ ...investment, amount: Number(investment.amount), createdAt: investment.createdAt.toISOString(), updatedAt: investment.updatedAt.toISOString() })
}
