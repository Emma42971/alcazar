export const dynamic = "force-dynamic"
import { requireInvestor } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { InvestorHeader } from "@/components/investor/InvestorHeader"
import Link from "next/link"
import { TrendingUp, BarChart2, FileText, Building2, ArrowRight, Clock, Bell, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const user = await requireInvestor()

  const grants = await prisma.accessGrant.findMany({
    where: { userId: user.id, revokedAt: null },
    include: { project: true },
    orderBy: { grantedAt: "desc" },
  })

  const grantedProjectIds = grants.map(g => g.projectId)

  const [pendingNdas, recentActivity, notifications, updates, investments] = await Promise.all([
    prisma.ndaRequest.findMany({
      where: { userId: user.id, status: "PENDING" },
      include: { project: { select: { name: true, slug: true } } },
    }),
    prisma.documentActivity.findMany({
      where: { userId: user.id },
      take: 5, orderBy: { viewedAt: "desc" },
      include: { document: { select: { name: true } }, project: { select: { name: true } } },
    }),
    prisma.notification.findMany({
      where: { userId: user.id, readAt: null },
      take: 5, orderBy: { createdAt: "desc" }
    }),
    grantedProjectIds.length > 0 ? prisma.projectUpdate.findMany({
      where: { projectId: { in: grantedProjectIds }, isPublic: true },
      take: 5, orderBy: { createdAt: "desc" },
      include: { project: { select: { name: true, slug: true } } }
    }) : Promise.resolve([]),
    prisma.investment.findMany({
      where: { investorId: user.id, status: { in: ["CONFIRMED", "PENDING"] } },
    }),
  ])

  // Real portfolio value from actual investments
  const totalInvested = investments.reduce((s, i) => s + Number(i.amount ?? 0), 0)
  const activeGrants = grants.filter(g => !g.expiresAt || new Date(g.expiresAt) > new Date())
  const unreadNotifs = notifications.length

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      <InvestorHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Investor Dashboard</h1>
            <p className="page-subtitle">Your portfolio and investment opportunities.</p>
          </div>
          {unreadNotifs > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: "hsl(var(--warning-light))", color: "hsl(var(--warning))" }}>
              <Bell className="h-4 w-4" />
              <span>{unreadNotifs} new notification{unreadNotifs > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* KPI Cards — real data */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="kpi-navy">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Total Invested</p>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">
              {totalInvested > 0
                ? `$${totalInvested >= 1000000 ? `${(totalInvested/1000000).toFixed(1)}M` : totalInvested >= 1000 ? `${(totalInvested/1000).toFixed(0)}K` : totalInvested.toLocaleString()}`
                : "—"}
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              {investments.length > 0 ? `${investments.length} confirmed investment${investments.length > 1 ? "s" : ""}` : "No confirmed investments yet"}
            </p>
          </div>

          <div className="kpi-emerald">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
                <BarChart2 className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>Active Data Rooms</p>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{activeGrants.length}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
              {activeGrants.length > 0 ? "Projects accessible" : "No access yet"}
            </p>
          </div>

          <div className="kpi-navy">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
                <FileText className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Pending Actions</p>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{pendingNdas.length + unreadNotifs}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              {pendingNdas.length > 0 ? `${pendingNdas.length} NDA${pendingNdas.length > 1 ? "s" : ""} under review` : unreadNotifs > 0 ? `${unreadNotifs} notification${unreadNotifs > 1 ? "s" : ""}` : "All up to date"}
            </p>
          </div>
        </div>

        {/* NDA pending alert */}
        {pendingNdas.length > 0 && (
          <div className="alert alert-warning">
            <Clock className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">NDA{pendingNdas.length > 1 ? "s" : ""} under review</p>
              <p className="text-xs mt-0.5 opacity-80">{pendingNdas.map(n => n.project.name).join(", ")} — awaiting admin approval</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="lg:col-span-2 space-y-4">
            {grants.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold" style={{ color: "hsl(var(--text))" }}>Active Data Rooms</h2>
                  <Link href="/projects" className="flex items-center gap-1 text-sm" style={{ color: "hsl(var(--text-subtle))" }}>
                    Browse all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {grants.slice(0, 4).map(g => {
                    const p = g.project
                    const raised = Number(p.raisedAmount ?? 0)
                    const target = Number(p.targetRaise ?? 0)
                    const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0
                    const expired = g.expiresAt && new Date(g.expiresAt) < new Date()
                    return (
                      <Link key={g.id} href={`/dashboard/${p.slug}`} className="card card-p flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "hsl(var(--navy))" }}>
                          {p.coverImage
                            ? <img src={p.coverImage} alt={p.name} className="w-full h-full object-cover" />
                            : <Building2 className="h-5 w-5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate" style={{ color: "hsl(var(--text))" }}>{p.name}</p>
                            {expired && <span className="badge badge-red text-xs shrink-0">Expired</span>}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>{p.sector ?? "Investment"}</p>
                          {target > 0 && (
                            <div className="mt-2 space-y-1">
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--bg-subtle))" }}>
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "hsl(var(--emerald))" }} />
                              </div>
                              <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{pct}% funded</p>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--text-muted))" }} />
                      </Link>
                    )
                  })}
                </div>
              </>
            )}

            {grants.length === 0 && (
              <div className="card card-p text-center py-12 space-y-4">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "hsl(var(--emerald-light))" }}>
                  <Building2 className="h-6 w-6" style={{ color: "hsl(var(--emerald))" }} />
                </div>
                <div>
                  <p className="font-bold" style={{ color: "hsl(var(--text))" }}>No data rooms yet</p>
                  <p className="text-sm mt-1" style={{ color: "hsl(var(--text-subtle))" }}>Browse opportunities and sign an NDA to get started.</p>
                </div>
                <Link href="/projects" className="btn btn-primary inline-flex">Explore opportunities →</Link>
              </div>
            )}
          </div>

          {/* Right sidebar — updates + recent activity */}
          <div className="space-y-5">
            {/* Project updates */}
            {updates.length > 0 && (
              <div className="card overflow-hidden">
                <div className="card-header">
                  <h3 className="card-title">Project updates</h3>
                </div>
                <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                  {updates.map(u => (
                    <Link key={u.id} href={`/dashboard/${u.project.slug}`} className="block p-3 hover:bg-opacity-50 transition-colors" style={{ background: "transparent" }}>
                      <p className="text-xs font-medium truncate" style={{ color: "hsl(var(--emerald))" }}>{u.project.name}</p>
                      <p className="text-sm font-medium mt-0.5 truncate" style={{ color: "hsl(var(--text))" }}>{u.title}</p>
                      <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                        {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent document activity */}
            {recentActivity.length > 0 && (
              <div className="card overflow-hidden">
                <div className="card-header">
                  <h3 className="card-title">Recent activity</h3>
                </div>
                <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                  {recentActivity.map(a => (
                    <div key={a.id} className="p-3">
                      <p className="text-sm truncate" style={{ color: "hsl(var(--text))" }}>{a.document.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                        {a.project.name} · {new Date(a.viewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
