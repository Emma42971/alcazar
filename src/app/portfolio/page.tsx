export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { InvestorHeader } from "@/components/investor/InvestorHeader"
import { PortfolioClient } from "./PortfolioClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "My Portfolio" }

export default async function PortfolioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")
  const userId = session.user.id

  const [investments, distributions, referral] = await Promise.all([
    prisma.investment.findMany({
      where: { investorId: userId },
      include: { project: { select: { id: true, name: true, slug: true, sector: true, logoImage: true, coverImage: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.distribution.findMany({
      where: { investorId: userId },
      include: { project: { select: { name: true } } },
      orderBy: { scheduledDate: "desc" },
    }),
    prisma.referralCode.findFirst({ where: { userId } }),
  ])

  const projectIds = [...new Set(investments.map(i => i.projectId))]
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true, raisedAmount: true, targetRaise: true, irrTargetBps: true }
  })
  const projectMap = Object.fromEntries(projects.map(p => [p.id, { ...p, raisedAmount: Number(p.raisedAmount ?? 0), targetRaise: Number(p.targetRaise ?? 0) }]))

  const totalInvested = investments.reduce((s, i) => s + Number(i.amount ?? 0), 0)
  const totalReceived = distributions.filter(d => d.status === "PAID").reduce((s, d) => s + Number(d.amount ?? 0), 0)

  const summary = { totalInvested, totalReceived, count: projectIds.length }

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      <InvestorHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <PortfolioClient
          investments={JSON.parse(JSON.stringify(investments))}
          distributions={JSON.parse(JSON.stringify(distributions))}
          summary={summary}
          referral={referral ? JSON.parse(JSON.stringify(referral)) : null}
          projects={projectMap}
        />
      </main>
    </div>
  )
}
