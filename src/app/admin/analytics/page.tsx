export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { getEngagementScore, engagementLabel, engagementColor } from "@/lib/engagement"
import { AnalyticsChartsClient } from "./AnalyticsChartsClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Analytics" }
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project: pid } = await searchParams
  const projects = await prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  const projectId = pid ?? projects[0]?.id ?? ""

  const [topDocs, investors, recentActivity] = await Promise.all([
    prisma.documentActivity.groupBy({
      by: ["documentId"],
      where: { projectId, event: "open" },
      _count: { id: true },
      _sum: { durationMs: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.accessGrant.findMany({ where: { projectId }, include: { user: { include: { profile: true } } } }),
    prisma.documentActivity.findMany({ where: { projectId }, orderBy: { viewedAt: "desc" }, take: 30, include: { document: { select: { name: true } }, user: { include: { profile: { select: { firstName: true, lastName: true } } } } } }),
  ])

  const docNames = await prisma.document.findMany({ where: { id: { in: topDocs.map(d => d.documentId) } }, select: { id: true, name: true } })
  const docMap = Object.fromEntries(docNames.map(d => [d.id, d.name]))

  const investorScores = await Promise.all(
    investors.map(async g => {
      const score = projectId ? await getEngagementScore(g.userId, projectId) : 0
      const name  = g.user.profile ? `${g.user.profile.firstName} ${g.user.profile.lastName}` : g.user.email
      return { userId: g.userId, name, score }
    })
  )
  investorScores.sort((a, b) => b.score - a.score)

  const chartData = topDocs.map(d => ({ name: (docMap[d.documentId] ?? "Doc").slice(0, 20), views: d._count.id, avgSec: Math.round((d._sum.durationMs ?? 0) / 1000 / d._count.id) }))

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>Analytics</h1>
        <div className="flex gap-2 flex-wrap">
          {projects.length > 1 && (
            <select defaultValue={projectId} onChange={e => window.location.href = `/admin/analytics?project=${e.target.value}`} className="rounded-lg px-3 py-1.5 text-sm" style={{ background: "hsl(var(--surface-raised))", border: "1px solid hsl(var(--border))", color: "hsl(var(--text-subtle))", appearance: "auto" }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {projectId && <a href={`/api/admin/audit?projectId=${projectId}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "hsl(var(--border-strong))", color: "hsl(var(--text-subtle))" }}>📋 Audit Trail</a>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <AnalyticsChartsClient chartData={chartData} />

        {/* Engagement scores */}
        <div className="rounded-xl border p-5 space-y-4" style={{ background: "hsl(var(--surface))", borderColor: "hsl(var(--border))" }}>
          <h3 className="text-sm font-medium">Investor Engagement</h3>
          {investorScores.length === 0 ? <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>No investors with access.</p> : (
            <div className="space-y-3">
              {investorScores.map(inv => (
                <div key={inv.userId} className="flex items-center gap-3">
                  <span className="text-xs flex-1 truncate" style={{ color: "hsl(var(--text-subtle))" }}>{inv.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--bg-subtle))" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${inv.score}%`, background: inv.score >= 70 ? "hsl(142 71% 45%)" : inv.score >= 35 ? "hsl(38 92% 50%)" : "hsl(var(--border-strong))" }} />
                    </div>
                    <span className={`badge text-xs ${inv.score >= 70 ? "badge-approved" : inv.score >= 35 ? "badge-pending" : "badge-read"}`}>
                      {engagementLabel(inv.score)} {inv.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <h3 className="text-sm font-medium">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Time</th><th>Investor</th><th>Document</th><th>Duration</th></tr></thead>
            <tbody>
              {recentActivity.map(a => {
                const name = a.user.profile ? `${a.user.profile.firstName} ${a.user.profile.lastName}` : a.user.email
                return (
                  <tr key={a.id}>
                    <td className="text-xs whitespace-nowrap" style={{ color: "hsl(var(--text-subtle))" }}>{new Date(a.viewedAt).toLocaleString()}</td>
                    <td className="text-sm" style={{ color: "hsl(var(--text))" }}>{name}</td>
                    <td className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>{a.document.name}</td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{a.durationMs ? `${Math.round(a.durationMs / 1000)}s` : "—"}</td>
                  </tr>
                )
              })}
              {recentActivity.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-sm" style={{ color: "hsl(var(--text-muted))" }}>No activity yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
