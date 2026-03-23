export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { UserPlus, Download } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Investors" }

export default async function InvestorsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams

  const where: any = { role: "INVESTOR" }
  if (status) where.status = status
  if (q) where.OR = [
    { email: { contains: q } },
    { profile: { firstName: { contains: q } } },
    { profile: { lastName: { contains: q } } },
    { profile: { companyName: { contains: q } } },
  ]

  const [investors, counts] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        profile: true,
        ndaRequests: { orderBy: { createdAt: "desc" }, take: 1 },
        accessGrants: { take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    Promise.all([
      prisma.user.count({ where: { role: "INVESTOR" } }),
      prisma.user.count({ where: { role: "INVESTOR", status: "PENDING_APPROVAL" } }),
      prisma.user.count({ where: { role: "INVESTOR", status: "APPROVED" } }),
      prisma.user.count({ where: { role: "INVESTOR", status: "REJECTED" } }),
    ]),
  ])

  const [total, pending, approved, rejected] = counts

  const tabs = [
    { label: "All",      value: "",                count: total    },
    { label: "Pending",  value: "PENDING_APPROVAL", count: pending  },
    { label: "Approved", value: "APPROVED",          count: approved },
    { label: "Rejected", value: "REJECTED",          count: rejected },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Investors</h1>
          <p className="page-subtitle">{total} total investors registered</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/investors/import" className="btn-secondary btn-sm gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />Import CSV
          </Link>
          <a href="/api/admin/investors/export" className="btn-secondary btn-sm gap-1.5">
            <Download className="h-3.5 w-3.5" />Export
          </a>
        </div>
      </div>

      <div className="section space-y-4">
        {/* Tabs + Search */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1">
            {tabs.map(tab => {
              const active = (tab.value === "" ? !status : status === tab.value)
              return (
                <Link
                  key={tab.label}
                  href={tab.value ? `/admin/investors?status=${tab.value}` : "/admin/investors"}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium transition-all"
                  style={{
                    background: active ? "var(--blue)" : "var(--surface)",
                    color: active ? "#fff" : "var(--text-secondary)",
                    border: active ? "none" : "1px solid var(--border)",
                  }}
                >
                  {tab.label}
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: active ? "rgba(255,255,255,0.2)" : "var(--bg-subtle)", color: active ? "#fff" : "var(--text-muted)" }}>
                    {tab.count}
                  </span>
                </Link>
              )
            })}
          </div>
          <form className="flex items-center gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search investors..."
              className="input h-8"
              style={{ width: "220px" }}
            />
            {status && <input type="hidden" name="status" value={status} />}
          </form>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Company</th>
                <th>Type</th>
                <th>Ticket</th>
                <th>Status</th>
                <th>NDA</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {investors.map(u => {
                const name = u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email
                const initials = u.profile ? `${u.profile.firstName[0]}${u.profile.lastName[0]}` : u.email[0].toUpperCase()
                const nda = u.ndaRequests[0]
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">{initials}</div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{name}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{u.profile?.companyName ?? "—"}</td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{u.profile?.investorType ?? "—"}</td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{u.profile?.estTicket ?? "—"}</td>
                    <td>
                      <span className={`badge text-xs ${u.status === "APPROVED" ? "badge-green" : u.status === "REJECTED" ? "badge-red" : "badge-amber"}`}>
                        {u.status === "PENDING_APPROVAL" ? "Pending" : u.status === "APPROVED" ? "Approved" : "Rejected"}
                      </span>
                    </td>
                    <td>
                      {nda ? (
                        <span className={`badge text-xs ${nda.status === "APPROVED" ? "badge-green" : nda.status === "PENDING" ? "badge-amber" : "badge-red"}`}>
                          {nda.status}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>None</span>
                      )}
                    </td>
                    <td className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {u.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td>
                      <Link href={`/admin/investors/${u.id}`} className="btn-secondary btn-sm">View</Link>
                    </td>
                  </tr>
                )
              })}
              {investors.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state py-12">
                      <div className="empty-state-icon">👥</div>
                      <p className="empty-state-title">No investors found</p>
                      <p className="empty-state-desc">Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
