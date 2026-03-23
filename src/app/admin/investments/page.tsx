export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { InvestmentsClient } from "./InvestmentsClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Investments" }

export default async function InvestmentsPage() {
  const [investments, projects, investors] = await Promise.all([
    prisma.investment.findMany({
      orderBy: { createdAt: "desc" },
      include: { distributions: { select: { id: true, amount: true, status: true } } }
    }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "INVESTOR", status: "APPROVED" },
      include: { profile: true },
      orderBy: { createdAt: "desc" }
    })
  ])

  const totalConfirmed = investments.filter(i => i.status === "CONFIRMED")
    .reduce((s, i) => s + Number(i.amountUsd), 0)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Investments</h1>
          <p className="page-subtitle">
            {investments.filter(i => i.status === "CONFIRMED").length} confirmed · ${totalConfirmed.toLocaleString()} USD total
          </p>
        </div>
      </div>
      <InvestmentsClient
        investments={JSON.parse(JSON.stringify(investments.map(i => ({ ...i, amount: Number(i.amount), createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(), confirmedAt: i.confirmedAt?.toISOString() ?? null }))))}
        projects={projects}
        investors={investors.map(i => ({ id: i.id, name: i.profile ? `${i.profile.firstName} ${i.profile.lastName}` : i.email, email: i.email }))}
      />
    </div>
  )
}
