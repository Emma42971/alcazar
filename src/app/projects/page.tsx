export const dynamic = "force-dynamic"
import { requireInvestor } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { InvestorHeader } from "@/components/investor/InvestorHeader"
import Link from "next/link"
import { Search, Building2, ArrowRight } from "lucide-react"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Explore Projects" }

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ sector?: string; risk?: string; q?: string }> }) {
  const user = await requireInvestor()
  const { sector, risk, q } = await searchParams

  const where: any = { teaserPublic: true, lifecycle: { in: ["LIVE", "PREPARATION"] } }
  if (sector) where.sector = sector
  if (risk) where.riskLevel = risk
  if (q) where.name = { contains: q }

  const [projects, grants] = await Promise.all([
    prisma.project.findMany({ where, orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }] }),
    prisma.accessGrant.findMany({ where: { userId: user.id, revokedAt: null }, select: { projectId: true } }),
  ])

  const sectors = ["Real Estate", "Technology", "Healthcare", "Energy", "Private Equity", "Infrastructure", "Other"]
  const grantedIds = new Set(grants.map(g => g.projectId))

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      <InvestorHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <div>
          <h1 className="page-title">Explore Investment Projects</h1>
          <p className="page-subtitle">Overview of your investment projects</p>
        </div>

        {/* Search bar */}
        <form method="GET" className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(var(--text-muted))" }} />
            <input name="q" defaultValue={q ?? ""} placeholder="Search projects..." className="input pl-9" />
          </div>
          {/* Filters */}
          <select name="sector" defaultValue={sector ?? ""} className="input select" style={{ width: "auto", minWidth: 200 }}>
            <option value="">Industry: All</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select name="risk" defaultValue={risk ?? ""} className="input select" style={{ width: "auto", minWidth: 180 }}>
            <option value="">Risk Level: All</option>
            {["Low", "Medium", "Medium-High", "High"].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="submit" className="btn btn-secondary">Apply</button>
        </form>

        {/* Projects grid — like Image 2 */}
        {projects.length === 0 ? (
          <div className="card card-p text-center py-14">
            <Building2 className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(var(--text-muted))" }} />
            <p className="font-semibold">No projects available</p>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--text-subtle))" }}>Check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {projects.map(p => {
              const raised = Number(p.raisedAmount ?? 0)
              const target = Number(p.targetRaise ?? 0)
              const pct = target > 0 ? Math.round((raised / target) * 100) : 0
              const irr = p.irrTargetBps ? `${(p.irrTargetBps / 100).toFixed(0)}%` : null
              const hasAccess = grantedIds.has(p.id)

              return (
                <div key={p.id} className="card overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {p.logoImage
                          ? <img src={p.logoImage} alt={p.name} className="h-10 w-10 rounded-lg object-cover shrink-0 border" style={{ borderColor: "hsl(var(--border))" }} />
                          : <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(var(--navy))" }}>
                              <Building2 className="h-5 w-5 text-white" />
                            </div>
                        }
                        <div>
                          <h3 className="font-bold text-base" style={{ color: "hsl(var(--text))" }}>{p.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Building2 className="h-3 w-3" style={{ color: "hsl(var(--text-muted))" }} />
                            <span className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{p.sector ?? "Industry"}</span>
                          </div>
                        </div>
                      </div>
                      {p.isFeatured && <span className="badge badge-emerald">Featured</span>}
                    </div>

                    {p.summary && (
                      <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--text-subtle))" }}>
                        {p.summary.slice(0, 120)}{p.summary.length > 120 ? "…" : ""}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                      {irr && (
                        <span style={{ color: "hsl(var(--text-subtle))" }}>
                          ROI: <strong style={{ color: "hsl(var(--text))" }}>{irr}</strong>
                        </span>
                      )}
                      {p.expectedDuration && (
                        <span style={{ color: "hsl(var(--text-subtle))" }}>
                          Duration: <strong style={{ color: "hsl(var(--text))" }}>{p.expectedDuration}</strong>
                        </span>
                      )}
                    </div>

                    {target > 0 && (
                      <div className="space-y-1.5">
                        <div className="progress-bar">
                          <div className="progress-fill progress-blue" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>
                          Funding: ${(raised/1000000).toFixed(1)}M of ${(target/1000000).toFixed(1)}M ({pct}% funded)
                        </p>
                      </div>
                    )}

                    <Link
                      href={hasAccess ? `/dashboard/${p.slug}` : `/projects/${p.slug}`}
                      className="btn btn-primary w-full"
                    >
                      {hasAccess ? "Open Data Room →" : "Access Data Room"}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
