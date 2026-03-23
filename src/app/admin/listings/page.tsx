export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { ListingsClient } from "./ListingsClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Marketplace Listings" }

export default async function ListingsPage() {
  const [listings, projects, categories] = await Promise.all([
    prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true }
    }),
    prisma.project.findMany({ select: { id: true, name: true, tenantId: true }, orderBy: { name: "asc" } }),
    prisma.listingCategory.findMany({ orderBy: { sortOrder: "asc" } })
  ])

  const serialize = (l: any) => ({
    ...l,
    publishedAt: l.publishedAt?.toISOString() ?? null,
    closingDate: l.closingDate?.toISOString() ?? null,
    featuredUntil: l.featuredUntil?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Marketplace Listings</h1>
          <p className="page-subtitle">
            {listings.filter(l => l.status === "ACTIVE").length} actifs · {listings.filter(l => l.status === "DRAFT").length} brouillons
          </p>
        </div>
      </div>
      <ListingsClient
        listings={listings.map(serialize)}
        projects={projects}
        categories={categories}
      />
    </div>
  )
}
