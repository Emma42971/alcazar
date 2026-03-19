export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

function parseProject(data: any) {
  return {
    name:             data.name,
    slug:             data.slug || slugify(data.name),
    summary:          data.summary ?? null,
    description:      data.description ?? null,
    country:          data.country ?? null,
    sector:           data.sector ?? null,
    status:           data.status ?? "Open",
    minTicket:        data.minTicket ? Number(data.minTicket) : null,
    irrTargetBps:     data.irrTargetBps ? Number(data.irrTargetBps) : null,
    investmentType:   data.investmentType ?? null,
    targetRaise:      data.targetRaise ? BigInt(Math.round(Number(data.targetRaise))) : null,
    raisedAmount:     data.raisedAmount ? BigInt(Math.round(Number(data.raisedAmount))) : null,
    currency:         data.currency ?? "USD",
    expectedDuration: data.expectedDuration ?? null,
    riskLevel:        data.riskLevel ?? null,
    ndaText:          data.ndaText ?? null,
    videoUrl:         data.videoUrl ?? null,
    closingDate:      data.closingDate ? new Date(data.closingDate) : null,
    isFeatured:       Boolean(data.isFeatured),
    teaserPublic:     Boolean(data.teaserPublic),
    seoIndexable:     Boolean(data.seoIndexable),
    ndaRequired:      data.ndaRequired !== undefined ? Boolean(data.ndaRequired) : true,
    twoFaRequired:    Boolean(data.twoFaRequired),
    notifyOnOpen:     Boolean(data.notifyOnOpen),
    sortOrder:        data.sortOrder ? Number(data.sortOrder) : 0,
    brandColor:       data.brandColor ?? null,
    brandName:        data.brandName ?? null,
    highlights:       data.highlights ?? [],
    publicMetrics:    data.publicMetrics ?? { irr: true, minTicket: true },
  }
}

export async function GET() {
  await requireAdmin()
  const projects = await prisma.project.findMany({
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  })
  return NextResponse.json({ projects })
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  try {
    const body = await req.json()
    const data = parseProject(body)
    const project = await prisma.project.create({ data })
    return NextResponse.json({ success: true, project: { id: project.id, slug: project.slug } })
  } catch (err: any) {
    console.error("CREATE PROJECT ERROR:", err)
    return NextResponse.json({ error: err.message ?? "Failed to create project" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  await requireAdmin()
  try {
    const { id, ...body } = await req.json()
    const data = parseProject(body)
    const project = await prisma.project.update({ where: { id }, data })
    return NextResponse.json({ success: true, project: { id: project.id, slug: project.slug } })
  } catch (err: any) {
    console.error("UPDATE PROJECT ERROR:", err)
    return NextResponse.json({ error: err.message ?? "Failed to update project" }, { status: 500 })
  }
}
