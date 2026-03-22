export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProjectUnifiedClient } from "./ProjectUnifiedClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Projet" }

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [project, investors, capTable] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        documents: { include: { folder: true }, orderBy: { sortOrder: "asc" } },
        documentFolders: { orderBy: { sortOrder: "asc" } },
        projectQuestions: {
          include: { user: { include: { profile: true } } },
          orderBy: { createdAt: "desc" },
          take: 50
        },
        ddChecklist: { orderBy: { sortOrder: "asc" } },
        updates: { orderBy: { createdAt: "desc" } },
        accessGrants: { include: { user: { include: { profile: true } } } },
        workflowRules: { include: { _count: { select: { logs: true } } } },
        capTable: { include: { user: { include: { profile: true } } }, orderBy: { amount: "desc" } },
        eSignRequests: {
          include: {
            recipient: { include: { profile: true } },
            document: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" }
        },
      }
    }),
    prisma.user.findMany({
      where: { role: "INVESTOR", status: "APPROVED" },
      include: { profile: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.capTableEntry.findMany({ where: { projectId: id } })
  ])

  if (!project) notFound()

  const totalRaised = capTable.reduce((s, e) => s + Number(e.amount), 0)

  const serialized = {
    ...project,
    targetRaise: project.targetRaise ? Number(project.targetRaise) : null,
    raisedAmount: project.raisedAmount ? Number(project.raisedAmount) : null,
    closingDate: project.closingDate?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    capTable: project.capTable.map(e => ({ ...e, amount: Number(e.amount), createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString() })),
    projectQuestions: project.projectQuestions.map(q => ({ ...q, createdAt: q.createdAt.toISOString(), answeredAt: q.answeredAt?.toISOString() ?? null })),
    updates: project.updates.map(u => ({ ...u, createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() })),
    workflowRules: project.workflowRules.map(w => ({ ...w, createdAt: w.createdAt.toISOString(), lastRunAt: w.lastRunAt?.toISOString() ?? null })),
    eSignRequests: project.eSignRequests.map(e => ({ ...e, createdAt: e.createdAt.toISOString(), signedAt: e.signedAt?.toISOString() ?? null, expiresAt: e.expiresAt?.toISOString() ?? null })),
    accessGrants: project.accessGrants.map(g => ({ ...g, grantedAt: g.grantedAt.toISOString(), expiresAt: g.expiresAt?.toISOString() ?? null, revokedAt: g.revokedAt?.toISOString() ?? null })),
    documents: project.documents.map(d => ({ ...d, publishedAt: d.publishedAt?.toISOString() ?? null, createdAt: d.createdAt.toISOString() })),
    ddChecklist: project.ddChecklist.map(d => ({ ...d, createdAt: d.createdAt.toISOString() })),
  }

  return (
    <ProjectUnifiedClient
      project={serialized}
      investors={investors.map(i => ({ id: i.id, name: i.profile ? `${i.profile.firstName} ${i.profile.lastName}` : i.email, email: i.email }))}
      totalRaised={totalRaised}
    />
  )
}
