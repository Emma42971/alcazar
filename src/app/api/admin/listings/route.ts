export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await requireAdmin()
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true }
  })
  return NextResponse.json(listings.map(l => ({
    ...l,
    publishedAt: l.publishedAt?.toISOString() ?? null,
    closingDate: l.closingDate?.toISOString() ?? null,
    featuredUntil: l.featuredUntil?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  })))
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const body = await req.json()

  // Auto-generate SEO slug
  const { default: slugify } = await import("slugify")
  const seoSlug = slugify(body.title, { lower: true, strict: true }) + "-" + Date.now().toString(36)

  const listing = await prisma.listing.create({
    data: {
      projectId: body.projectId,
      tenantId: body.tenantId ?? "",
      title: body.title,
      shortDesc: body.shortDesc,
      targetReturn: body.targetReturn ?? null,
      minTicketUsd: body.minTicketUsd ?? null,
      currency: body.currency ?? "USD",
      region: body.region ?? null,
      categoryId: body.categoryId ?? null,
      seoSlug,
      status: "DRAFT",
      tags: body.tags ?? null,
    }
  })

  return NextResponse.json({ ...listing, publishedAt: null, closingDate: null, createdAt: listing.createdAt.toISOString(), updatedAt: listing.updatedAt.toISOString() })
}
