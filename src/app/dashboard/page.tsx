export const dynamic = "force-dynamic"
import { requireInvestor } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { InvestorHeader } from "@/components/investor/InvestorHeader"
import Link from "next/link"
import { Building2, FileCheck, FolderOpen, CheckCircle2, Clock, Lock } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "My Dashboard" }

export default async function DashboardPage() {
  const user = await requireInvestor()

  const [grants, pendingNdas, profile] = await Promise.all([
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
  ])

  const isApproved = user.status === "APPROVED"
  const hasNdaSigned = pendingNdas.length > 0 || grants.length > 0
  const hasAccess = grants.length > 0

  const steps = [
    { label: "Account Registered",  done: true,       icon: CheckCircle2 },
    { label: "Account Approved",    done: isApproved, icon: CheckCircle2 },
    { label: "NDA Submitted",       done: hasNdaSigned, icon: FileCheck },
    { label: "Access Granted",      done: hasAccess,  icon: FolderOpen },
  ]

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      <InvestorHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text))", letterSpacing: "-0.025em" }}>
            Welcome back{profile ? `, ${profile.firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "hsl(var(--text-subtle))" }}>
            Your investor portal dashboard
          </p>
        </div>

        {/* Timeline */}
        {!hasAccess && (
          <div className="card card-p">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--text))" }}>Application Status</h2>
            <div className="flex items-start gap-0">
              {steps.map((step, i) => (
                <div key={step.label} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center z-10"
                      style={{ background: step.done ? "hsl(var(--success))" : "hsl(var(--bg-subtle))", border: `2px solid ${step.done ? "hsl(var(--success))" : "hsl(var(--border))"}` }}>
                      {step.done
                        ? <CheckCircle2 className="h-4 w-4 text-white" />
                        : <Clock className="h-4 w-4" style={{ color: "hsl(var(--text-muted))" }} />}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="absolute top-4 left-1/2 w-full h-0.5" style={{ background: step.done ? "hsl(var(--success))" : "hsl(var(--border))" }} />
                    )}
                    <p className="mt-2 text-xs text-center font-medium" style={{ color: step.done ? "hsl(var(--text))" : "hsl(var(--text-muted))" }}>
                      {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending NDAs */}
        {pendingNdas.length > 0 && (
          <div className="alert alert-warning">
            <Clock className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">NDA{pendingNdas.length > 1 ? "s" : ""} under review</p>
              <p className="text-xs mt-0.5 opacity-80">
                {pendingNdas.map(n => n.project.name).join(", ")} — awaiting admin approval
              </p>
            </div>
          </div>
        )}

        {/* Granted projects */}
        {grants.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: "hsl(var(--text))" }}>My Projects</h2>
              <Link href="/projects" className="btn btn-ghost btn-sm">Browse all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {grants.map(g => {
                const expired = g.expiresAt && new Date(g.expiresAt) < new Date()
                const daysLeft = g.expiresAt ? Math.ceil((new Date(g.expiresAt).getTime() - Date.now()) / 86400000) : null
                return (
                  <Link key={g.id} href={`/dashboard/${g.project.slug}`}
                    className="card card-p group hover:shadow-md transition-shadow space-y-3">
                    <div className="flex items-start gap-3">
                      {g.project.logoImage
                        ? <img src={g.project.logoImage} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" style={{ border: "1px solid hsl(var(--border))" }} />
                        : <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold" style={{ background: "hsl(var(--accent-light))", color: "hsl(var(--accent))" }}>
                            {g.project.name.charAt(0)}
                          </div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ color: "hsl(var(--text))" }}>{g.project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`badge ${expired ? "badge-red" : "badge-green"}`}>
                            {expired ? "Expired" : "Active"}
                          </span>
                          {g.project.sector && <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{g.project.sector}</span>}
                        </div>
                      </div>
                    </div>
                    {daysLeft !== null && !expired && daysLeft <= 30 && (
                      <p className="text-xs" style={{ color: "hsl(var(--warning))" }}>
                        ⚠ Access expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--accent))" }}>
                      <FolderOpen className="h-3.5 w-3.5" />
                      <span>Open Data Room →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {grants.length === 0 && pendingNdas.length === 0 && isApproved && (
          <div className="card card-p text-center py-12 space-y-4">
            <div className="h-14 w-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "hsl(var(--accent-light))" }}>
              <Lock className="h-6 w-6" style={{ color: "hsl(var(--accent))" }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: "hsl(var(--text))" }}>No project access yet</p>
              <p className="text-sm mt-1" style={{ color: "hsl(var(--text-subtle))" }}>Browse our investment opportunities and sign an NDA to request access.</p>
            </div>
            <Link href="/projects" className="btn btn-primary inline-flex">Browse Opportunities →</Link>
          </div>
        )}
      </main>
    </div>
  )
}
