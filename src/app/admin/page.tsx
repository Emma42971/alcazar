import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { AdminDashboardCharts } from "./AdminDashboardCharts"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin Dashboard" }

export default async function AdminDashboardPage() {
  const [totalInvestors, pendingApprovals, pendingNdas, openInquiries, totalProjects, recentActivity] = await Promise.all([
    prisma.user.count({ where: { role: "INVESTOR" } }),
    prisma.user.count({ where: { role: "INVESTOR", status: "PENDING_APPROVAL" } }),
    prisma.ndaRequest.count({ where: { status: "PENDING" } }),
    prisma.contactInquiry.count({ where: { status: "NEW" } }),
    prisma.project.count(),
    prisma.documentActivity.findMany({
      take: 8,
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
    { label: "Total Investors",     value: totalInvestors,   href: "/admin/investors",  urgent: false },
    { label: "Pending Approvals",   value: pendingApprovals, href: "/admin/investors",  urgent: pendingApprovals > 0 },
    { label: "NDAs Awaiting",       value: pendingNdas,      href: "/admin/ndas",       urgent: pendingNdas > 0 },
    { label: "New Inquiries",       value: openInquiries,    href: "/admin/inquiries",  urgent: openInquiries > 0 },
    { label: "Active Projects",     value: totalProjects,    href: "/admin/projects",   urgent: false },
  ]

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: "hsl(0 0% 45%)" }}>Overview of your investor portal.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map(kpi => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="rounded-xl border p-4 transition-colors"
            style={{
              background: kpi.urgent ? "hsl(38 92% 50% / 0.05)" : "hsl(0 0% 5.5%)",
              borderColor: kpi.urgent ? "hsl(38 92% 50% / 0.25)" : "hsl(0 0% 11%)",
            }}
          >
            <p className="text-2xl font-semibold" style={{ color: kpi.urgent ? "hsl(38 92% 60%)" : "hsl(0 0% 92%)" }}>
              {kpi.value}
            </p>
            <p className="text-xs mt-1" style={{ color: "hsl(0 0% 45%)" }}>{kpi.label}</p>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <AdminDashboardCharts chartData={chartData} />

      {/* Recent activity */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium" style={{ color: "hsl(0 0% 60%)" }}>Recent Activity</h2>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(0 0% 11%)" }}>
          {recentActivity.length === 0 ? (
            <p className="p-6 text-sm" style={{ color: "hsl(0 0% 35%)" }}>No activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th><th>Investor</th><th>Document</th><th>Project</th><th>Event</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map(a => {
                    const name = a.user.profile
                      ? `${a.user.profile.firstName} ${a.user.profile.lastName}`
                      : a.user.email
                    return (
                      <tr key={a.id}>
                        <td className="text-xs whitespace-nowrap" style={{ color: "hsl(0 0% 40%)" }}>
                          {a.viewedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="text-sm" style={{ color: "hsl(0 0% 80%)" }}>{name}</td>
                        <td className="text-sm" style={{ color: "hsl(0 0% 65%)" }}>{a.document.name}</td>
                        <td className="text-xs" style={{ color: "hsl(0 0% 45%)" }}>{a.project.name}</td>
                        <td>
                          <span className={`badge text-xs ${a.event === "open" ? "badge-new" : "badge-read"}`}>
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
    </div>
  )
}
