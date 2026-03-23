export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Users, Building2, DollarSign, TrendingUp, Globe, Activity } from "lucide-react"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Super Admin — Platform Overview" }

export default async function SuperAdminPage() {
  const [
    totalTenants, activeTenants, totalProjects,
    totalInvestors, totalListings, recentTenants
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { active: true } }),
    prisma.project.count(),
    prisma.user.count({ where: { role: "INVESTOR" } }),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" }, take: 10,
      include: { plan: true }
    })
  ])

  // MRR calculation
  const plans = await prisma.tenantPlan.findMany({ where: { status: "ACTIVE" } })
  const planPrices = { STARTER: 99, PRO: 299, ENTERPRISE: 999 }
  const mrr = plans.reduce((sum, p) => sum + (planPrices[p.name as keyof typeof planPrices] ?? 0), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Overview</h1>
          <p className="page-subtitle">Super Admin — All tenants</p>
        </div>
        <Link href="/super-admin/tenants/new" className="btn btn-primary">+ New Tenant</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Tenants", value: totalTenants, icon: Globe, color: "var(--navy)" },
          { label: "Active", value: activeTenants, icon: Activity, color: "var(--emerald)" },
          { label: "Projects", value: totalProjects, icon: Building2, color: "var(--blue)" },
          { label: "Investors", value: totalInvestors, icon: Users, color: "var(--navy)" },
          { label: "Listings", value: totalListings, icon: TrendingUp, color: "var(--emerald)" },
          { label: "MRR", value: `$${mrr.toLocaleString()}`, icon: DollarSign, color: "var(--success)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="kpi-card">
            <Icon className="h-4 w-4 mb-2" style={{ color: `hsl(${color})` }} />
            <p className="text-xl font-bold" style={{ color: "hsl(var(--text))" }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tenants table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="card-title">All Tenants</h3>
          <Link href="/super-admin/tenants" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        <table className="data-table">
          <thead><tr><th>Tenant</th><th>Slug</th><th>Plan</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {recentTenants.map(t => (
              <tr key={t.id}>
                <td className="font-medium">{t.name}</td>
                <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{t.slug}</td>
                <td>
                  {t.plan && <span className={`badge ${t.plan.name === "ENTERPRISE" ? "badge-navy" : t.plan.name === "PRO" ? "badge-blue" : "badge-gray"}`}>
                    {t.plan.name}
                  </span>}
                </td>
                <td>
                  <span className={`badge ${t.active ? "badge-green" : "badge-red"}`}>
                    {t.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <Link href={`/super-admin/tenants/${t.id}`} className="btn btn-ghost btn-sm">Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
