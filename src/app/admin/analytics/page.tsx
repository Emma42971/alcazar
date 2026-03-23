export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { AnalyticsChartsClient } from "./AnalyticsChartsClient"
import Link from "next/link"
import { AnalyticsProjectSelect } from "./AnalyticsProjectSelect"
import { ClipboardList } from "lucide-react"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Analytics" }

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project: projectId } = await searchParams

  const projects = await prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })

  const whereActivity = projectId ? { projectId } : {}
  const recentActivity = await prisma.documentActivity.findMany({
    where: whereActivity, take: 50, orderBy: { viewedAt: "desc" },
    include: {
      document: { select: { name: true } },
      user: { include: { profile: { select: { firstName: true, lastName: true } } } },
    },
  })

  const docStats = await prisma.documentActivity.groupBy({
    by: ["documentId"], where: whereActivity, _count: { id: true },
    orderBy: { _count: { id: "desc" } }, take: 10,
  })
  const docIds = docStats.map(d => d.documentId)
  const docNames = await prisma.document.findMany({ where: { id: { in: docIds } }, select: { id: true, name: true } })
  const chartData = docStats.map(d => ({
    name: docNames.find(n => n.id === d.documentId)?.name?.slice(0, 22) ?? "Unknown",
    views: d._count.id,
    avgSec: 0,
  }))

  const investors = await prisma.accessGrant.findMany({
    where: projectId ? { projectId } : {},
    include: { user: { include: { profile: true, documentActivities: { where: whereActivity } } } },
  })
  const investorScores = investors.map(g => {
    const acts = g.user.documentActivities
    const score = Math.min(100, acts.length * 8)
    const name = g.user.profile ? `${g.user.profile.firstName} ${g.user.profile.lastName}` : g.user.email
    return { name, score }
  }).sort((a, b) => b.score - a.score).slice(0, 8)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Document engagement and investor activity</p>
        </div>
        <div className="flex items-center gap-2">
<AnalyticsProjectSelect projects={projects} current={projectId} />
          {projectId && (
            <a href={`/api/admin/audit?projectId=${projectId}`} target="_blank" className="btn btn-secondary">
              <ClipboardList className="h-4 w-4" />Audit Trail
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AnalyticsChartsClient chartData={chartData} />

        {/* Investor engagement */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Investor Engagement</h3>
          </div>
          <div className="card-p space-y-3">
            {investorScores.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "hsl(var(--text-muted))" }}>No investors with access.</p>
            ) : (
              investorScores.map(inv => (
                <div key={inv.name} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ background: "hsl(var(--accent-light))", color: "hsl(var(--accent))" }}>
                    {inv.name.charAt(0)}
                  </div>
                  <span className="text-sm flex-1 truncate" style={{ color: "hsl(var(--text))" }}>{inv.name}</span>
                  <div className="w-24 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: "hsl(var(--bg-subtle))" }}>
                    <div className="h-full rounded-full" style={{
                      width: `${inv.score}%`,
                      background: inv.score >= 70 ? "hsl(var(--success))" : inv.score >= 35 ? "hsl(var(--warning))" : "hsl(var(--border-strong))"
                    }} />
                  </div>
                  <span className="text-xs w-10 text-right shrink-0" style={{
                    color: inv.score >= 70 ? "hsl(var(--success))" : inv.score >= 35 ? "hsl(var(--warning))" : "hsl(var(--text-muted))"
                  }}>
                    {inv.score >= 70 ? "Hot" : inv.score >= 35 ? "Warm" : "Cold"} {inv.score}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Activity table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
          <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{recentActivity.length} events</span>
        </div>
        {recentActivity.length === 0 ? (
          <div className="card-p text-center py-8">
            <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>No activity yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Investor</th><th>Document</th><th>Duration</th></tr></thead>
              <tbody>
                {recentActivity.map(a => {
                  const name = a.user.profile ? `${a.user.profile.firstName} ${a.user.profile.lastName}` : a.user.email
                  return (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap" style={{ fontSize: "0.75rem", color: "hsl(var(--text-subtle))" }}>
                        {new Date(a.viewedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="font-medium">{name}</td>
                      <td style={{ color: "hsl(var(--text-subtle))" }}>{a.document.name}</td>
                      <td style={{ color: "hsl(var(--text-muted))", fontSize: "0.75rem" }}>
                        {a.durationMs ? `${Math.round(a.durationMs / 1000)}s` : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
