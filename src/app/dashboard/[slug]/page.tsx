export const dynamic = "force-dynamic"
import { requireInvestor } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { InvestorHeader } from "@/components/investor/InvestorHeader"
import { DataRoomClient } from "./DataRoomClient"
import { NdaGate } from "@/components/shared/NdaGate"
import { Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = await prisma.project.findUnique({ where: { slug }, select: { name: true } })
  return { title: p?.name ?? "Data Room" }
}

export default async function DataRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireInvestor()
  const { slug } = await params

  const project = await prisma.project.findUnique({ where: { slug } })
  if (!project) redirect("/projects")

  const [grant, ndaReq, documents, folders, recentActivity, questions, projectUpdates] = await Promise.all([
    prisma.accessGrant.findUnique({ where: { userId_projectId: { userId: user.id, projectId: project.id } } }),
    prisma.ndaRequest.findFirst({ where: { userId: user.id, projectId: project.id }, orderBy: { createdAt: "desc" } }),
    prisma.document.findMany({
      where: { projectId: project.id, status: "PUBLISHED" },
      orderBy: [{ folderId: "asc" }, { sortOrder: "asc" }],
      select: { id: true, name: true, fileType: true, filePath: true, sizeBytes: true, label: true, allowDownload: true, folderId: true, projectId: true }
    }),
    prisma.documentFolder.findMany({
      where: { projectId: project.id },
      orderBy: [{ sortOrder: "asc" }, { index: "asc" }]
    }),
    prisma.documentActivity.findMany({
      where: { projectId: project.id },
      take: 10, orderBy: { viewedAt: "desc" },
      include: {
        user: { include: { profile: { select: { firstName: true, lastName: true } } } },
        document: { select: { name: true } },
      }
    }),
    prisma.projectQuestion.findMany({
      where: { projectId: project.id, userId: user.id, parentId: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.projectUpdate.findMany({
      where: { projectId: project.id, isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const isExpired = grant?.expiresAt && new Date(grant.expiresAt) < new Date()
  const isRevoked = !!grant?.revokedAt
  const hasAccess = !!grant && !isExpired && !isRevoked

  const ndaText = project.ndaText ?? `NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement ("Agreement") is entered into as of the date of signature between ${project.name} ("Company") and the undersigned investor ("Recipient").\n\n1. CONFIDENTIALITY\nRecipient agrees to keep all information strictly confidential.\n\n2. NON-DISCLOSURE\nRecipient shall not disclose any information to third parties.\n\n3. TERM\nThis agreement remains in effect for 5 years.`

  const serializedActivity = recentActivity.map(a => ({
    id: a.id, userId: a.userId,
    investorName: a.user.profile ? `${a.user.profile.firstName} ${a.user.profile.lastName}` : a.user.email,
    documentName: a.document.name,
    event: a.event,
    viewedAt: a.viewedAt.toISOString(),
  }))

  const serializedQuestions = questions.map(q => ({
    id: q.id, question: q.question, answer: q.answer,
    category: q.category, createdAt: q.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      <InvestorHeader
        brandName={project.brandName}
        brandColor={project.brandColor}
        brandLogo={project.brandLogo}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header — with "Invest Now" button like Image 3 */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <Link href="/dashboard" className="btn btn-ghost btn-icon-sm mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="page-title">{project.name}</h1>
              <p className="page-subtitle">{project.summary ? project.summary.slice(0, 100) + (project.summary.length > 100 ? "…" : "") : "Secure investment data room"}</p>
            </div>
          </div>
          <button className="btn btn-primary btn-lg shrink-0">
            Invest Now →
          </button>
        </div>

        {!hasAccess ? (
          <NdaGate
            project={project}
            user={user}
            hasAccess={hasAccess}
            ndaStatus={ndaReq?.status ?? null}
          />
        ) : (
          <DataRoomClient
            projectId={project.id}
            projectName={project.name}
            projectSlug={slug}
            folders={folders}
            documents={documents}
            recentActivity={serializedActivity}
            questions={serializedQuestions}
            updates={projectUpdates.map(u => ({ ...u, createdAt: u.createdAt.toISOString() }))}
            userId={user.id}
          />
        )}
      </main>
    </div>
  )
}
