import { InvestorHeader } from "@/components/investor/InvestorHeader"
export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { MarketplaceClient } from "./MarketplaceClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Explore Investment Opportunities — Alcazar",
  description: "Discover exclusive investment projects across real estate, private equity, and alternative assets.",
}

export default async function MarketplacePage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; region?: string; min?: string; search?: string; currency?: string }>
}) {
  const params = await searchParams

  const where: any = { status: "ACTIVE" }
  if (params.category) where.categoryId = params.category
  if (params.region) where.region = params.region
  if (params.currency) where.currency = params.currency
  if (params.min) where.minTicketUsd = { lte: parseInt(params.min) }
  if (params.search) where.OR = [
    { title: { contains: params.search } },
    { shortDesc: { contains: params.search } },
  ]

  const [listings, featured, categories] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }, { publishedAt: "desc" }],
      take: 50,
      include: { category: true }
    }),
    prisma.listing.findMany({
      where: { status: "ACTIVE", isFeatured: true },
      take: 3,
      orderBy: { viewCount: "desc" }
    }),
    prisma.listingCategory.findMany({ orderBy: { sortOrder: "asc" } })
  ])

  // Get project details for listings
  const projectIds = listings.map(l => l.projectId)
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, coverImage: true, sector: true, raisedAmount: true, targetRaise: true }
  })
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]))

  const serialize = (l: any) => ({
    ...l,
    publishedAt: l.publishedAt?.toISOString() ?? null,
    closingDate: l.closingDate?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    featuredUntil: l.featuredUntil?.toISOString() ?? null,
    project: projectMap[l.projectId] ? {
      ...projectMap[l.projectId],
      raisedAmount: projectMap[l.projectId].raisedAmount ? Number(projectMap[l.projectId].raisedAmount) : null,
      targetRaise: projectMap[l.projectId].targetRaise ? Number(projectMap[l.projectId].targetRaise) : null,
    } : null,
  })

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      <InvestorHeader />
      <MarketplaceClient
      listings={listings.map(serialize)}
      featured={featured.map(serialize)}
      categories={categories}
    />
    </div>
  )
}
