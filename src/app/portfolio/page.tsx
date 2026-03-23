export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PortfolioClient } from "./PortfolioClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "My Portfolio" }

export default async function PortfolioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const [investments, distributions, summary, referral] = await Promise.all([
    prisma.investment.findMany({
      where: { investorId: session.user.id, status: { in: ["CONFIRMED", "PENDING"] } },
      orderBy: { createdAt: "desc" },
      include: {
        distributions: { orderBy: { createdAt: "desc" }, take: 5 }
      }
    }),
    prisma.distribution.findMany({
      where: { investorId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.investorPortfolioSummary.findUnique({
      where: { investorId: session.user.id }
    }),
    prisma.referralCode.findUnique({
      where: { userId: session.user.id },
      include: { referrals: true }
    })
  ])

  // Get project details
  const projectIds = [...new Set(investments.map(i => i.projectId))]
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true, slug: true, coverImage: true, sector: true, lifecycle: true }
  })
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]))

  const serialize = (obj: any) => JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? Number(v) : v
  ))

  return (
    <PortfolioClient
      investments={serialize(investments)}
      distributions={serialize(distributions)}
      summary={serialize(summary)}
      referral={serialize(referral)}
      projects={projectMap}
    />
  )
}
