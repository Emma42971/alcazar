export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { AdminDashboardCharts } from "./AdminDashboardCharts"
import { Users, Building2, FileCheck, MessageSquare, TrendingUp, Clock } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard — Admin" }

export default async function AdminDashboardPage() {
  const [totalInvestors, pendingApprovals, pendingNdas, openInquiries, totalProjects, recentActivity] = await Promise.all([
    prisma.user.count({ where: { role: "INVESTOR" } }),
    prisma.user.count({ where: { role: "INVESTOR", status: "PENDING_APPROVAL" } }),
    prisma.ndaRequest.count({ where: { status: "PENDING" } }),
    prisma.contactInquiry.count({ where: { status: "NEW" } }),
    prisma.project.count(),
    prisma.documentActivity.findMany({
      take: 10,
      orderBy: { viewedAt: "desc" },
      include: {
        document: { select: { name: true } },
        user: { include: { profile: { select: { firstName: true, lastName: true } } } },
        project: { select: { name: true } },
      },
    }),
  ])

  const activityData = await prisma.documentActivity.groupBy({
    by: ["viewedAt"],
    _count: { id: true },
    orderBy: { viewedAt: "asc" },
    take: 30,
  })
  const chartData = activityData.map(d => ({
    date: d.viewedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    views: d._count.id,
  }))

  const kpis = [
    { label: "Total Investors",   value: totalInvestors,   href: "/admin/investors", icon: Users,        urgent: false,                 change: null },
    { label: "Pending Approvals", value: pendingApprovals, href: "/admin/investors", icon: Clock,        urgent: pendingApprovals > 0,  change: null },
    { label: "NDAs Awaiting",     value: pendingNdas,      href: "/admin/ndas",      icon: FileCheck,    urgent: pendingNdas > 0,       change: null },
    { label: "New Inquiries",     value: openInquiries,    href: "/admin/inquiries", icon: MessageSquare, urgent: openInquiries > 0,    change: null },
    { label: "Active Projects",   value: totalProjects,    href: "/admin/projects",  icon: Building2,    urgent: false,                 change: null },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your investor portal activity</p>
      </div>

      <div className="section space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpis.map(kpi => {
            const Icon = kpi.icon
            return (
              <Link key={kpi.label} href={kpi.href} className="stat-card hover:shadow transition-shadow" style={{ borderColor: kpi.urgent ? "var(--amber-border)" : "var(--border)", background: kpi.urgent ? "var(--amber-light)" : "var(--surface)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: kpi.urgent ? "var(--amber-border)" : "var(--bg-subtle)" }}>
                    <Icon className="h-4 w-4" style={{ color: kpi.urgent ? "var(--amber)" : "var(--text-secondary)" }} />
                  </div>
                  {kpi.urgent && kpi.value > 0 && (
                    <span className="badge-amber badge text-xs">{kpi.value}</span>
                  )}
                </div>
                <p className="stat-value" style={{ color: kpi.urgent && kpi.value > 0 ? "var(--amber)" : "var(--text-primary)" }}>{kpi.value}</p>
                <p className="stat-label">{kpi.label}</p>
              </Link>
            )
          })}
        </div>

        {/* Chart */}
        <AdminDashboardCharts chartData={chartData} />

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Recent Activity</h3>
            </div>
            <Link href="/admin/analytics" className="text-xs font-medium" style={{ color: "var(--blue)" }}>View all →</Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <p className="empty-state-title">No activity yet</p>
              <p className="empty-state-desc">Activity will appear here once investors start accessing documents.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Investor</th>
                    <th>Document</th>
                    <th>Project</th>
                    <th>Event</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map(a => {
                    const name = a.user.profile
                      ? `${a.user.profile.firstName} ${a.user.profile.lastName}`
                      : a.user.email
                    return (
                      <tr key={a.id}>
                        <td className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                          {a.viewedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="avatar h-6 w-6 text-xs">{name.charAt(0)}</div>
                            <span className="text-sm">{name}</span>
                          </div>
                        </td>
                        <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{a.document.name}</td>
                        <td className="text-xs" style={{ color: "var(--text-muted)" }}>{a.project.name}</td>
                        <td>
                          <span className={`badge ${a.event === "open" ? "badge-blue" : "badge-gray"} text-xs`}>{a.event}</span>
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
    </div>
  )
}
