export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { auditLog } from "@/lib/audit"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params
  const { status, confirmedBy } = await req.json()

  const investment = await prisma.investment.update({
    where: { id },
    data: {
      status,
      confirmedAt: status === "CONFIRMED" ? new Date() : undefined,
      confirmedBy: status === "CONFIRMED" ? confirmedBy ?? admin.id : undefined,
    }
  })

  if (status === "CONFIRMED") {
    // Notify investor
    await createNotification({
      userId: investment.investorId,
      type: "ACCESS_GRANTED",
      title: "Investment Confirmed ✅",
      body: `Your investment of ${investment.currency} ${Number(investment.amount).toLocaleString()} has been confirmed.`,
    })

    // Update portfolio summary
    await prisma.investorPortfolioSummary.upsert({
      where: { investorId: investment.investorId },
      create: {
        investorId: investment.investorId,
        totalInvestedUsd: investment.amountUsd,
        activeInvestments: 1,
        totalProjects: 1,
      },
      update: {
        totalInvestedUsd: { increment: investment.amountUsd },
        activeInvestments: { increment: 1 },
        totalProjects: { increment: 1 },
        lastUpdated: new Date(),
      }
    })
  }

  await auditLog({ action: "ADMIN_ACTION", userId: admin.id, targetId: id, targetType: "Investment", details: { action: "status_update", status } })

  return NextResponse.json({ ...investment, amount: Number(investment.amount), createdAt: investment.createdAt.toISOString(), updatedAt: investment.updatedAt.toISOString() })
}
