"use client"
import { useState } from "react"
import Link from "next/link"
import { TrendingUp, DollarSign, BarChart2, Gift, Building2, Calendar, ChevronRight } from "lucide-react"

const TABS = [
  { id: "overview",      label: "Overview",       icon: BarChart2 },
  { id: "investments",   label: "Investments",     icon: Building2 },
  { id: "distributions", label: "Distributions",   icon: DollarSign },
  { id: "referral",      label: "Referral Program", icon: Gift },
]

export function PortfolioClient({ investments, distributions, summary, referral, projects }: {
  investments: any[]; distributions: any[]; summary: any; referral: any; projects: Record<string, any>
}) {
  const [tab, setTab] = useState("overview")

  const totalInvested = investments.filter(i => i.status === "CONFIRMED")
    .reduce((s, i) => s + Number(i.amount), 0)
  const totalReceived = distributions.filter(d => d.status === "PAID")
    .reduce((s, d) => s + d.amount, 0)
  const activeCount = investments.filter(i => i.status === "CONFIRMED").length

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      {/* Header */}
      <div className="px-6 py-8" style={{ background: "hsl(var(--navy))" }}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: "Total Invested", value: `$${totalInvested.toLocaleString()}`, icon: DollarSign },
              { label: "Total Received", value: `$${totalReceived.toLocaleString()}`, icon: TrendingUp },
              { label: "Active Investments", value: activeCount, icon: Building2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.08)" }}>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</p>
                <p className="text-2xl font-bold text-white mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                color: tab === id ? "hsl(var(--emerald))" : "hsl(var(--text-subtle))",
                borderBottom: tab === id ? "2px solid hsl(var(--emerald))" : "2px solid transparent",
                background: "transparent", marginBottom: -1,
              }}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card card-p space-y-3">
              <h3 className="card-title">Portfolio Summary</h3>
              {[
                ["Total Invested", `$${totalInvested.toLocaleString()}`],
                ["Total Received", `$${totalReceived.toLocaleString()}`],
                ["Net Position", `$${(totalInvested + totalReceived).toLocaleString()}`],
                ["Active Deals", activeCount],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                  <span className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>{label}</span>
                  <span className="font-semibold text-sm" style={{ color: "hsl(var(--text))" }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="card card-p space-y-3">
              <h3 className="card-title">Recent Distributions</h3>
              {distributions.slice(0, 5).length === 0 ? (
                <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>No distributions yet</p>
              ) : distributions.slice(0, 5).map(d => (
                <div key={d.id} className="flex justify-between py-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>{d.type}</p>
                    <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{d.period ?? new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="font-semibold text-sm" style={{ color: "hsl(var(--emerald))" }}>
                    +${d.amount.toLocaleString()} {d.currency}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investments */}
        {tab === "investments" && (
          <div className="space-y-3">
            {investments.length === 0 ? (
              <div className="card p-12 text-center">
                <Building2 className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(var(--text-muted))" }} />
                <p className="font-medium" style={{ color: "hsl(var(--text))" }}>No investments yet</p>
                <Link href="/marketplace" className="btn btn-primary btn-sm mt-3">Explore Opportunities</Link>
              </div>
            ) : investments.map(inv => {
              const project = projects[inv.projectId]
              return (
                <div key={inv.id} className="card card-p flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "hsl(var(--emerald-light))" }}>
                    <Building2 className="h-5 w-5" style={{ color: "hsl(var(--emerald))" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "hsl(var(--text))" }}>
                      {project?.name ?? "Project"}
                    </p>
                    <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                      {project?.sector} · {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: "hsl(var(--text))" }}>
                      {inv.currency} {Number(inv.amount).toLocaleString()}
                    </p>
                    <span className={`badge text-xs ${inv.status === "CONFIRMED" ? "badge-green" : "badge-yellow"}`}>
                      {inv.status}
                    </span>
                  </div>
                  {project && (
                    <Link href={`/dashboard/${project.slug}`} className="btn btn-ghost btn-icon-sm">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Distributions */}
        {tab === "distributions" && (
          <div className="card overflow-hidden">
            <div className="card-header">
              <h3 className="card-title">Distribution History</h3>
              <span className="text-sm font-semibold" style={{ color: "hsl(var(--emerald))" }}>
                Total: ${totalReceived.toLocaleString()}
              </span>
            </div>
            {distributions.length === 0 ? (
              <div className="p-10 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
                <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>No distributions received yet</p>
              </div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Date</th><th>Type</th><th>Period</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {distributions.map(d => (
                    <tr key={d.id}>
                      <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="text-sm">{d.type}</td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{d.period ?? "—"}</td>
                      <td className="font-semibold" style={{ color: "hsl(var(--emerald))" }}>+${d.amount.toLocaleString()} {d.currency}</td>
                      <td><span className={`badge ${d.status === "PAID" ? "badge-green" : d.status === "SCHEDULED" ? "badge-yellow" : "badge-red"}`}>{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Referral */}
        {tab === "referral" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card card-p space-y-4">
              <h3 className="card-title">Your Referral Code</h3>
              {referral ? (
                <>
                  <div className="rounded-xl p-4 text-center" style={{ background: "hsl(var(--emerald-light))" }}>
                    <p className="text-2xl font-bold tracking-widest" style={{ color: "hsl(var(--emerald))" }}>
                      {referral.code}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg" style={{ background: "hsl(var(--bg-subtle))" }}>
                      <p className="text-2xl font-bold" style={{ color: "hsl(var(--text))" }}>{referral.usageCount}</p>
                      <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Referrals</p>
                    </div>
                    <div className="text-center p-3 rounded-lg" style={{ background: "hsl(var(--bg-subtle))" }}>
                      <p className="text-2xl font-bold" style={{ color: "hsl(var(--emerald))" }}>${referral.rewardTotal}</p>
                      <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Earned</p>
                    </div>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(`https://alc.e42.ca/register?ref=${referral.code}`)}
                    className="btn btn-secondary w-full">Copy Referral Link</button>
                </>
              ) : (
                <div className="text-center py-6">
                  <Gift className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(var(--text-muted))" }} />
                  <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Referral program coming soon</p>
                </div>
              )}
            </div>
            <div className="card card-p space-y-3">
              <h3 className="card-title">How It Works</h3>
              {[
                ["Share your code", "Send your unique referral link to friends and colleagues"],
                ["They register", "When they create an account using your link"],
                ["They invest", "When their first investment is confirmed"],
                ["You earn", "Receive a reward for each successful referral"],
              ].map(([step, desc], i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                    style={{ background: "hsl(var(--navy))" }}>{i + 1}</div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>{step}</p>
                    <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
