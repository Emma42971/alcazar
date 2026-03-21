export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { PipelineClient } from "./PipelineClient"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Pipeline" }

export default async function PipelinePage() {
  const investors = await prisma.user.findMany({
    where: { role: "INVESTOR" },
    include: {
      profile: true,
      accessGrants: { include: { project: { select: { name: true } } } },
      ndaRequests: { orderBy: { createdAt: "desc" }, take: 1 },
      investorNotes: { orderBy: { createdAt: "desc" }, take: 3 },
      investorTags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const serialized = investors.map(inv => ({
    id: inv.id,
    email: inv.email,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    profile: inv.profile ? {
      firstName: inv.profile.firstName,
      lastName: inv.profile.lastName,
      companyName: inv.profile.companyName,
      investorType: inv.profile.investorType,
      estTicket: inv.profile.estTicket,
      country: inv.profile.country,
      pipelineStage: inv.profile.pipelineStage,
    } : null,
    accessGrants: inv.accessGrants.map(g => ({ projectName: g.project.name })),
    latestNdaStatus: inv.ndaRequests[0]?.status ?? null,
    notes: inv.investorNotes.map(n => ({ id: n.id, content: n.content, createdAt: n.createdAt.toISOString() })),
    tags: inv.investorTags.map(t => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
  }))

  return (
    <div className="p-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Investor Pipeline</h1>
          <p className="page-subtitle">Track investors through your deal funnel.</p>
        </div>
      </div>
      <PipelineClient investors={serialized} />
    </div>
  )
}
