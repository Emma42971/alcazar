export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { ReportsClient } from "./ReportsClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Reports" }

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project: projectId } = await searchParams
  const projects = await prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  const currentProject = projectId ?? projects[0]?.id ?? null

  if (!currentProject) return (
    <div className="p-6"><h1 className="page-title mb-4">Reports</h1>
      <div className="card card-p text-center py-10 text-sm" style={{ color: "hsl(var(--text-muted))" }}>Create a project first.</div>
    </div>
  )

  const [grants, documents, activities] = await Promise.all([
    prisma.accessGrant.findMany({
      where: { projectId: currentProject, revokedAt: null },
      include: { user: { include: { profile: true } } },
    }),
    prisma.document.findMany({
      where: { projectId: currentProject, status: "PUBLISHED" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.documentActivity.findMany({
      where: { projectId: currentProject },
      select: { userId: true, documentId: true, event: true, durationMs: true, viewedAt: true },
    }),
  ])

  // Build matrix: investor × document
  const matrix = grants.map(g => {
    const name = g.user.profile ? `${g.user.profile.firstName} ${g.user.profile.lastName}` : g.user.email
    const company = g.user.profile?.companyName ?? ""
    const docScores = documents.map(doc => {
      const acts = activities.filter(a => a.userId === g.userId && a.documentId === doc.id)
      const views = acts.filter(a => a.event === "open").length
      const totalMs = acts.reduce((s, a) => s + (a.durationMs ?? 0), 0)
      return { docId: doc.id, views, totalSec: Math.round(totalMs / 1000) }
    })
    const totalViews = docScores.reduce((s, d) => s + d.views, 0)
    const score = Math.min(100, totalViews * 8)
    return { userId: g.userId, name, company, score, docScores, grantedAt: g.grantedAt.toISOString() }
  })

  return (
    <div className="p-6 max-w-full space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Engagement Report</h1>
          <p className="page-subtitle">Investor × Document activity matrix</p>
        </div>
        <div className="flex items-center gap-2">
          {projects.length > 1 && (
            <form method="GET">
              <select name="project" defaultValue={currentProject} className="input select" style={{ width: "auto" }}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </form>
          )}
          <a href={`/api/admin/reports/export?projectId=${currentProject}`} className="btn btn-secondary btn-sm">
            Export CSV
          </a>
        </div>
      </div>
      <ReportsClient matrix={matrix} documents={documents} />
    </div>
  )
}
