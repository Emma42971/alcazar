export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Users, Building2, FileCheck, HelpCircle, Shield, Activity, TrendingUp, Clock, ArrowRight } from "lucide-react"
import { AdminDashboardCharts } from "./AdminDashboardCharts"
import { DashboardActions } from "./DashboardActions"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Dashboard" }

export default async function AdminDashboardPage() {
  const [
    totalInvestors, pendingApprovals, pendingNdas,
    openQuestions, pendingKyc, totalProjects,
    recentActivity, approvedInvestors, accessGranted, ndaApproved
  ] = await Promise.all([
    prisma.user.count({ where: { role: "INVESTOR" } }),
    prisma.user.count({ where: { role: "INVESTOR", status: "PENDING_APPROVAL" } }),
    prisma.ndaRequest.count({ where: { status: "PENDING" } }),
    prisma.projectQuestion.count({ where: { status: "OPEN" } }),
    prisma.kycDocument.count({ where: { status: "PENDING" } }),
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
    prisma.accessGrant.count(),
    prisma.ndaRequest.count({ where: { status: "APPROVED" } }),
  ])

  // Action items — investisseurs en attente
  const pendingInvestors = await prisma.user.findMany({
    where: { role: "INVESTOR", status: "PENDING_APPROVAL" },
    include: { profile: true },
    take: 5,
    orderBy: { createdAt: "asc" }
  })

  // NDAs en attente
  const pendingNdaList = await prisma.ndaRequest.findMany({
    where: { status: "PENDING" },
    include: {
      user: { include: { profile: true } },
      project: { select: { name: true, id: true } }
    },
    take: 5,
    orderBy: { createdAt: "asc" }
  })

  // Questions sans réponse
  const openQList = await prisma.projectQuestion.findMany({
    where: { status: "OPEN" },
    include: {
      user: { include: { profile: true } },
      project: { select: { name: true, id: true } }
    },
    take: 5,
    orderBy: { createdAt: "asc" }
  })

  // KYC en attente
  const pendingKycList = await prisma.kycDocument.findMany({
    where: { status: "PENDING" },
    include: { user: { include: { profile: true } } },
    take: 5,
    orderBy: { createdAt: "asc" }
  })

  const chartData = await prisma.documentActivity.groupBy({
    by: ["viewedAt"], _count: { id: true },
    orderBy: { viewedAt: "asc" }, take: 30,
  }).then(d => d.map(r => ({
    date: r.viewedAt.toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
    views: r._count.id,
  })))

  const pipelineTotal = totalInvestors || 1
  const pctPending  = Math.round((pendingApprovals / pipelineTotal) * 100)
  const pctApproved = Math.round((approvedInvestors / pipelineTotal) * 100)
  const pctAccess   = Math.round((accessGranted / pipelineTotal) * 100)

  const serialize = (obj: any) => JSON.parse(JSON.stringify(obj))

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Vue d'ensemble et actions prioritaires</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Investisseurs", value: totalInvestors, href: "/admin/investors", icon: Users, color: "var(--emerald)" },
          { label: "En attente", value: pendingApprovals, href: "/admin/investors", icon: Clock, color: "var(--warning)", urgent: pendingApprovals > 0 },
          { label: "NDAs", value: pendingNdas, href: "/admin/compliance", icon: FileCheck, color: "var(--blue)", urgent: pendingNdas > 0 },
          { label: "Q&A ouverts", value: openQuestions, href: "/admin/questions", icon: HelpCircle, color: "var(--blue)", urgent: openQuestions > 0 },
          { label: "KYC soumis", value: pendingKyc, href: "/admin/compliance", icon: Shield, color: "var(--warning)", urgent: pendingKyc > 0 },
        ].map(({ label, value, href, icon: Icon, color, urgent }) => (
          <Link key={label} href={href}
            className={`kpi-card hover:shadow-md transition-shadow relative ${urgent && value > 0 ? "kpi-card-warn" : ""}`}>
            <div className="flex items-start justify-between mb-2">
              <Icon className="h-4 w-4" style={{ color: `hsl(${color})` }} />
              {urgent && value > 0 && <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "hsl(var(--warning))" }} />}
            </div>
            <div className="text-2xl font-bold" style={{ color: "hsl(var(--text))" }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* ACTION CARDS — le cœur du dashboard actionnable */}
      <DashboardActions
        pendingInvestors={serialize(pendingInvestors)}
        pendingNdas={serialize(pendingNdaList)}
        openQuestions={serialize(openQList)}
        pendingKyc={serialize(pendingKycList)}
      />

      {/* Pipeline */}
      {totalInvestors > 0 && (
        <div className="card card-p space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="card-title">{totalInvestors} Investisseurs</h3>
            <Link href="/admin/pipeline" className="btn btn-ghost btn-sm">Pipeline →</Link>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex" style={{ background: "hsl(var(--bg-subtle))" }}>
            <div style={{ width: `${pctPending}%`, background: "hsl(32 95% 65%)", transition: "width 0.4s" }} />
            <div style={{ width: `${pctApproved}%`, background: "hsl(221 83% 60%)", transition: "width 0.4s" }} />
            <div style={{ width: `${pctAccess}%`, background: "hsl(152 57% 50%)", transition: "width 0.4s" }} />
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            {[
              { color: "hsl(32 95% 65%)",  label: "En attente", value: pendingApprovals },
              { color: "hsl(221 83% 60%)", label: "Approuvés",  value: approvedInvestors },
              { color: "hsl(152 57% 50%)", label: "Accès accordé", value: accessGranted },
              { color: "hsl(var(--text-muted))", label: "NDA signé", value: ndaApproved },
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

      <AdminDashboardCharts chartData={chartData} />

      {/* Activité récente */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: "hsl(var(--text-subtle))" }} />
            <h3 className="card-title">Activité récente</h3>
          </div>
          <Link href="/admin/analytics" className="btn btn-ghost btn-sm">Voir tout →</Link>
        </div>
        {recentActivity.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucune activité</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Heure</th><th>Investisseur</th><th>Document</th><th>Projet</th><th>Événement</th></tr></thead>
              <tbody>
                {recentActivity.map(a => {
                  const name = a.user.profile ? `${a.user.profile.firstName} ${a.user.profile.lastName}` : a.user.email
                  return (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap text-xs" style={{ color: "hsl(var(--text-subtle))" }}>
                        {a.viewedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 text-white"
                            style={{ background: "hsl(var(--navy))" }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{name}</span>
                        </div>
                      </td>
                      <td style={{ color: "hsl(var(--text-subtle))" }}>{a.document.name}</td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{a.project.name}</td>
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
