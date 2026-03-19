import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Investors" }

export default async function InvestorsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const investors = await prisma.user.findMany({
    where: { role: "INVESTOR", ...(status ? { status: status as any } : {}) },
    include: { profile: true, ndaRequests: { orderBy: { createdAt: "desc" }, take: 1 }, accessGrants: { take: 1 } },
    orderBy: { createdAt: "desc" },
  })

  const tabs = [
    { label: "All",      value: undefined,            count: await prisma.user.count({ where: { role: "INVESTOR" } }) },
    { label: "Pending",  value: "PENDING_APPROVAL",   count: await prisma.user.count({ where: { role: "INVESTOR", status: "PENDING_APPROVAL" } }) },
    { label: "Approved", value: "APPROVED",            count: await prisma.user.count({ where: { role: "INVESTOR", status: "APPROVED" } }) },
    { label: "Rejected", value: "REJECTED",            count: await prisma.user.count({ where: { role: "INVESTOR", status: "REJECTED" } }) },
  ]

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>Investors</h1>
        <a href="/api/admin/investors/export" className="text-xs px-3 py-1.5 rounded-lg border transition-colors" style={{ borderColor: "hsl(0 0% 18%)", color: "hsl(0 0% 55%)" }}>↓ Export CSV</a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map(tab => {
          const active = (tab.value ?? undefined) === (status ?? undefined)
          return (
            <Link key={tab.label} href={tab.value ? `/admin/investors?status=${tab.value}` : "/admin/investors"}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ background: active ? "hsl(0 0% 11%)" : "transparent", borderColor: active ? "hsl(0 0% 22%)" : "hsl(0 0% 14%)", color: active ? "hsl(0 0% 85%)" : "hsl(0 0% 45%)" }}>
              {tab.label}
              <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: "hsl(0 0% 15%)", color: "hsl(0 0% 55%)" }}>{tab.count}</span>
            </Link>
          )
        })}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(0 0% 11%)" }}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Investor</th><th>Type</th><th>Ticket</th><th>Status</th><th>NDA</th><th>Registered</th><th></th></tr></thead>
            <tbody>
              {investors.map(u => {
                const name = u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email
                const nda  = u.ndaRequests[0]
                return (
                  <tr key={u.id}>
                    <td>
                      <p className="text-sm font-medium" style={{ color: "hsl(0 0% 88%)" }}>{name}</p>
                      <p className="text-xs" style={{ color: "hsl(0 0% 40%)" }}>{u.email}</p>
                    </td>
                    <td className="text-xs" style={{ color: "hsl(0 0% 55%)" }}>{u.profile?.investorType ?? "—"}</td>
                    <td className="text-xs" style={{ color: "hsl(0 0% 55%)" }}>{u.profile?.estTicket ?? "—"}</td>
                    <td><span className={`badge text-xs badge-${u.status === "APPROVED" ? "approved" : u.status === "REJECTED" ? "rejected" : "pending"}`}>{u.status.replace("_", " ")}</span></td>
                    <td><span className={`badge text-xs ${nda?.status === "APPROVED" ? "badge-approved" : nda?.status === "PENDING" ? "badge-pending" : "badge-read"}`}>{nda?.status ?? "NONE"}</span></td>
                    <td className="text-xs" style={{ color: "hsl(0 0% 40%)" }}>{u.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td><Link href={`/admin/investors/${u.id}`} className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}>View</Link></td>
                  </tr>
                )
              })}
              {investors.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-sm" style={{ color: "hsl(0 0% 35%)" }}>No investors found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
