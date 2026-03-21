export const dynamic = "force-dynamic"
import { requireInvestor } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { InvestorHeader } from "@/components/investor/InvestorHeader"
import { DataRoomClient } from "./DataRoomClient"
import type { Metadata } from "next"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await prisma.project.findUnique({ where: { slug }, select: { name: true } })
  return { title: p?.name ?? "Data Room" }
}

export default async function DataRoomPage({ params }: Props) {
  const { slug } = await params
  const user = await requireInvestor()

  const project = await prisma.project.findUnique({ where: { slug } })
  if (!project) notFound()

  // Verify access
  const grant = await prisma.accessGrant.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: project.id } },
  })
  if (!grant) redirect(`/projects/${slug}`)

  const documents = await prisma.document.findMany({
    where: { projectId: project.id, supersededBy: null },
    orderBy: { createdAt: "asc" },
  })

  const myQuestions = await prisma.projectQuestion.findMany({
    where: { userId: user.id, projectId: project.id },
    orderBy: { createdAt: "desc" },
  })

  // Activity counts per document
  const activityMap: Record<string, number> = {}
  const activities = await prisma.documentActivity.findMany({
    where: { userId: user.id, projectId: project.id, event: "open" },
    select: { documentId: true },
  })
  for (const a of activities) {
    activityMap[a.documentId] = (activityMap[a.documentId] ?? 0) + 1
  }

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--surface))" }}>
      <InvestorHeader
        brandName={project.brandName}
        brandColor={project.brandColor}
        brandLogo={project.brandLogo}
      />

      {/* Breadcrumb */}
      <div className="border-b px-4 sm:px-6 py-2.5 flex items-center gap-2 text-xs" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--text-subtle))" }}>
        <a href="/dashboard" className="hover:text-white transition-colors">My Projects</a>
        <span>›</span>
        <span style={{ color: "hsl(var(--text-subtle))" }}>{project.name}</span>
      </div>

      <DataRoomClient
        project={{
          id: project.id,
          name: project.name,
          summary: project.summary,
          description: project.description,
          logoImage: project.logoImage,
        }}
        documents={documents.map(d => ({
          id: d.id,
          name: d.name,
          filePath: d.filePath,
          fileType: d.fileType,
          sizeBytes: d.sizeBytes,
          version: d.version,
          createdAt: d.createdAt.toISOString(),
          viewCount: activityMap[d.id] ?? 0,
        }))}
        questions={myQuestions.map(q => ({
          id: q.id,
          question: q.question,
          answer: q.answer,
          answeredAt: q.answeredAt?.toISOString() ?? null,
          createdAt: q.createdAt.toISOString(),
        }))}
        userId={user.id}
      />
    </div>
  )
}
