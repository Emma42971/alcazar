export const dynamic = "force-dynamic"
import { requireInvestor } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { InvestorHeader } from "@/components/investor/InvestorHeader"
import Link from "next/link"
import { TrendingUp, BarChart2, FileText, Building2, ArrowRight, Clock } from "lucide-react"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const user = await requireInvestor()

  const [grants, pendingNdas, profile, recentActivity] = await Promise.all([
    prisma.accessGrant.findMany({
      where: { userId: user.id, revokedAt: null },
      include: { project: true },
      orderBy: { grantedAt: "desc" },
    }),
    prisma.ndaRequest.findMany({
      where: { userId: user.id, status: "PENDING" },
      include: { project: { select: { name: true, slug: true } } },
    }),
    prisma.investorProfile.findUnique({ where: { userId: user.id } }),
    prisma.documentActivity.findMany({
      where: { userId: user.id },
      take: 5, orderBy: { viewedAt: "desc" },
      include: { document: { select: { name: true } }, project: { select: { name: true } } },
    }),
  ])

  const totalValue = grants.reduce((s, g) => s + Number(g.project.raisedAmount ?? 0), 0)
  const activeCount = grants.filter(g => !g.expiresAt || new Date(g.expiresAt) > new Date()).length

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      <InvestorHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div>
          <h1 className="page-title">Investor Dashboard Overview</h1>
          <p className="page-subtitle">Your portfolio performance and project opportunities.</p>
        </div>

        {/* KPI Cards — exactly like mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Navy card */}
          <div className="kpi-navy">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Total Portfolio Value</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">
              ${totalValue >= 1000000 ? `${(totalValue/1000000).toFixed(1)}M` : totalValue >= 1000 ? `${(totalValue/1000).toFixed(0)}K` : totalValue.toLocaleString()}
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>Across {grants.length} project{grants.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Emerald card */}
          <div className="kpi-emerald">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
                <BarChart2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>Active Investments</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{activeCount}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>In diverse sectors</p>
          </div>

          {/* Navy card */}
          <div className="kpi-navy">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Pending Documents</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{pendingNdas.length}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              {pendingNdas.length > 0 ? "Awaiting review" : "All up to date"}
            </p>
          </div>
        </div>

        {/* Pending NDA alert */}
        {pendingNdas.length > 0 && (
          <div className="alert alert-warning">
            <Clock className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">NDA{pendingNdas.length > 1 ? "s" : ""} under review</p>
              <p className="text-xs mt-0.5 opacity-80">{pendingNdas.map(n => n.project.name).join(", ")} — awaiting admin approval</p>
            </div>
          </div>
        )}

        {/* Top Projects — exactly like mockup with cover images */}
        {grants.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "hsl(var(--text))" }}>Top Projects</h2>
              <Link href="/projects" className="flex items-center gap-1 text-sm font-medium" style={{ color: "hsl(var(--text-subtle))" }}>
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {grants.slice(0, 3).map(g => {
                const p = g.project
                const raised = Number(p.raisedAmount ?? 0)
                const target = Number(p.targetRaise ?? 0)
                const pct = target > 0 ? Math.round((raised / target) * 100) : 0
                const expired = g.expiresAt && new Date(g.expiresAt) < new Date()
                return (
                  <Link key={g.id} href={`/dashboard/${p.slug}`} className="project-card">
                    {/* Cover image */}
                    <div className="h-40 w-full relative overflow-hidden" style={{ background: "hsl(var(--navy))" }}>
                      {p.coverImage
                        ? <img src={p.coverImage} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-12 w-12" style={{ color: "rgba(255,255,255,0.2)" }} />
                          </div>
                      }
                      {expired && (
                        <div className="absolute top-2 right-2">
                          <span className="badge badge-red">Expired</span>
                        </div>
                      )}
                    </div>
                    {/* Card content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-base" style={{ color: "hsl(var(--text))" }}>{p.name}</h3>
                        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>{p.sector ?? "Investment"}</p>
                      </div>

                      {target > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span style={{ color: "hsl(var(--text-subtle))" }}>
                              Funding: ${(raised/1000000).toFixed(1)}M / ${(target/1000000).toFixed(1)}M
                            </span>
                            <span className="font-semibold" style={{ color: "hsl(var(--text))" }}>{pct}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill progress-emerald" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}

                      <div className="pt-1">
                        <div className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold" style={{ border: "1px solid hsl(var(--border))", color: "hsl(var(--text))" }}>
                          View Details
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {grants.length === 0 && pendingNdas.length === 0 && (
          <div className="card card-p text-center py-16 space-y-4">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "hsl(var(--emerald-light))" }}>
              <Building2 className="h-7 w-7" style={{ color: "hsl(var(--emerald))" }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "hsl(var(--text))" }}>No project access yet</p>
              <p className="text-sm mt-1" style={{ color: "hsl(var(--text-subtle))" }}>Browse our investment opportunities and sign an NDA to get started.</p>
            </div>
            <Link href="/projects" className="btn btn-primary inline-flex">Explore Projects →</Link>
          </div>
        )}
      </main>
    </div>
  )
}
