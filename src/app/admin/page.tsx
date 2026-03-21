export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Users, Building2, FileCheck, MessageSquare, Activity, TrendingUp, Clock } from "lucide-react"
import { AdminDashboardCharts } from "./AdminDashboardCharts"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard" }

export default async function AdminDashboardPage() {
  const [totalInvestors, pendingApprovals, pendingNdas, openInquiries, totalProjects, recentActivity, approvedInvestors] = await Promise.all([
    prisma.user.count({ where: { role: "INVESTOR" } }),
    prisma.user.count({ where: { role: "INVESTOR", status: "PENDING_APPROVAL" } }),
    prisma.ndaRequest.count({ where: { status: "PENDING" } }),
    prisma.contactInquiry.count({ where: { status: "NEW" } }),
    prisma.project.count(),
    prisma.documentActivity.findMany({
      take: 10, orderBy: { viewedAt: "desc" },
      include: {
        document: { select: { name: true } },
        user: { include: { profile: { select: { firstName: true, lastName: true } } } },
        project: { select: { name: true } },
      },
    }),
    prisma.user.count({ where: { role: "INVESTOR", status: "APPROVED" } }),
  ])

  const rejectedInvestors = await prisma.user.count({ where: { role: "INVESTOR", status: "REJECTED" } })
  const ndaApproved = await prisma.ndaRequest.count({ where: { status: "APPROVED" } })
  const accessGranted = await prisma.accessGrant.count()

  const chartData = await prisma.documentActivity.groupBy({
    by: ["viewedAt"], _count: { id: true },
    orderBy: { viewedAt: "asc" }, take: 30,
  }).then(d => d.map(r => ({
    date: r.viewedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    views: r._count.id,
  })))

  // Pipeline progress
  const pipelineTotal = totalInvestors || 1
  const pctPending  = Math.round((pendingApprovals / pipelineTotal) * 100)
  const pctApproved = Math.round((approvedInvestors / pipelineTotal) * 100)
  const pctAccess   = Math.round((accessGranted / pipelineTotal) * 100)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your investor portal activity</p>
        </div>
      </div>

      {/* KPI Grid — iDeals style avec border-left accent */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/investors" className="kpi-card kpi-card hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--accent-light))" }}>
              <Users className="h-4 w-4" style={{ color: "hsl(var(--accent))" }} />
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: "hsl(var(--text))" }}>{totalInvestors}</div>
          <div className="text-xs mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>Total Investors</div>
        </Link>

        <Link href="/admin/investors?status=PENDING_APPROVAL" className="kpi-card kpi-card-warn hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--warning-light))" }}>
              <Clock className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
            </div>
            {pendingApprovals > 0 && <span className="badge badge-yellow">{pendingApprovals}</span>}
          </div>
          <div className="text-2xl font-bold" style={{ color: "hsl(var(--text))" }}>{pendingApprovals}</div>
          <div className="text-xs mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>Pending Approvals</div>
        </Link>

        <Link href="/admin/ndas" className="kpi-card kpi-card-blue hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--blue-light))" }}>
              <FileCheck className="h-4 w-4" style={{ color: "hsl(var(--blue))" }} />
            </div>
            {pendingNdas > 0 && <span className="badge badge-blue">{pendingNdas}</span>}
          </div>
          <div className="text-2xl font-bold" style={{ color: "hsl(var(--text))" }}>{pendingNdas}</div>
          <div className="text-xs mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>NDAs Awaiting</div>
        </Link>

        <Link href="/admin/projects" className="kpi-card hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--bg-subtle))" }}>
              <Building2 className="h-4 w-4" style={{ color: "hsl(var(--text-subtle))" }} />
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: "hsl(var(--text))" }}>{totalProjects}</div>
          <div className="text-xs mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>Active Projects</div>
        </Link>
      </div>

      {/* Investor pipeline bar — iDeals style */}
      {totalInvestors > 0 && (
        <div className="card card-p space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="card-title">{totalInvestors} Investors</h3>
            <Link href="/admin/pipeline" className="btn btn-ghost btn-sm">View pipeline →</Link>
          </div>

          {/* Stacked progress bar */}
          <div className="h-2 rounded-full overflow-hidden flex" style={{ background: "hsl(var(--bg-subtle))" }}>
            <div style={{ width: `${pctPending}%`, background: "hsl(32 95% 65%)", transition: "width 0.4s" }} />
            <div style={{ width: `${pctApproved}%`, background: "hsl(221 83% 60%)", transition: "width 0.4s" }} />
            <div style={{ width: `${pctAccess}%`, background: "hsl(152 57% 50%)", transition: "width 0.4s" }} />
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            {[
              { color: "hsl(32 95% 65%)",  label: "Pending",  value: pendingApprovals },
              { color: "hsl(221 83% 60%)", label: "Approved", value: approvedInvestors },
              { color: "hsl(152 57% 50%)", label: "Access granted", value: accessGranted },
              { color: "hsl(var(--text-muted))", label: "NDA signed", value: ndaApproved },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>
                  <strong style={{ color: "hsl(var(--text))" }}>{item.value}</strong> {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <AdminDashboardCharts chartData={chartData} />

      {/* Recent activity table */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: "hsl(var(--text-subtle))" }} />
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <Link href="/admin/analytics" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {recentActivity.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl mb-2">📊</div>
            <p className="font-medium text-sm" style={{ color: "hsl(var(--text))" }}>No activity yet</p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--text-subtle))" }}>Activity will appear here once investors start accessing documents.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Investor</th><th>Document</th><th>Project</th><th>Event</th></tr></thead>
              <tbody>
                {recentActivity.map(a => {
                  const name = a.user.profile ? `${a.user.profile.firstName} ${a.user.profile.lastName}` : a.user.email
                  return (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap" style={{ color: "hsl(var(--text-subtle))", fontSize: "0.75rem" }}>
                        {a.viewedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                            style={{ background: "hsl(var(--accent-light))", color: "hsl(var(--accent))" }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{name}</span>
                        </div>
                      </td>
                      <td style={{ color: "hsl(var(--text-subtle))" }}>{a.document.name}</td>
                      <td style={{ color: "hsl(var(--text-muted))", fontSize: "0.75rem" }}>{a.project.name}</td>
                      <td>
                        <span className={`badge ${a.event === "open" ? "badge-blue" : a.event === "download" ? "badge-green" : "badge-gray"}`}>
                          {a.event}
                        </span>
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
