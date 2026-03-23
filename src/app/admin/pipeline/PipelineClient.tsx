"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LayoutGrid, List, Plus, Tag, StickyNote } from "lucide-react"

const STAGES = [
  { key: "LEAD",         label: "Lead",         color: "#94A3B8" },
  { key: "NDA_PENDING",  label: "NDA Pending",  color: "#F59E0B" },
  { key: "UNDER_REVIEW", label: "Under Review", color: "#3B82F6" },
  { key: "COMMITTED",    label: "Committed",    color: "#10B981" },
  { key: "CLOSED",       label: "Closed",       color: "#6B7280" },
]

type Investor = {
  id: string; email: string; status: string; createdAt: string
  profile: { firstName: string; lastName: string; companyName?: string | null; investorType?: string | null; estTicket?: string | null; country?: string | null; pipelineStage: string } | null
  accessGrants: { projectName: string }[]
  latestNdaStatus: string | null
  notes: { id: string; content: string; createdAt: string }[]
  tags: { id: string; name: string; color: string }[]
}

function InvestorCard({ investor }: { investor: Investor }) {
  const name = investor.profile ? `${investor.profile.firstName} ${investor.profile.lastName}` : investor.email
  return (
    <Link href={`/admin/investors/${investor.id}`} className="card card-p block group hover:shadow-md transition-shadow space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--text))" }}>{name}</p>
          <p className="text-xs truncate" style={{ color: "hsl(var(--text-subtle))" }}>{investor.profile?.companyName ?? investor.email}</p>
        </div>
        {investor.latestNdaStatus === "PENDING" && <span className="badge badge-yellow shrink-0">NDA</span>}
        {investor.status === "PENDING_APPROVAL" && <span className="badge badge-gray shrink-0">Pending</span>}
      </div>

      {(investor.profile?.estTicket || investor.profile?.country) && (
        <div className="flex gap-2 flex-wrap">
          {investor.profile.estTicket && <span className="text-xs px-2 py-0.5 rounded" style={{ background: "hsl(var(--accent-light))", color: "hsl(var(--accent))" }}>{investor.profile.estTicket}</span>}
          {investor.profile.country && <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>📍 {investor.profile.country}</span>}
        </div>
      )}

      {investor.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {investor.tags.map(tag => (
            <span key={tag.id} className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: tag.color + "20", color: tag.color, border: `1px solid ${tag.color}40` }}>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {investor.accessGrants.length > 0 && (
        <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
          {investor.accessGrants.length} project{investor.accessGrants.length > 1 ? "s" : ""} access
        </p>
      )}
    </Link>
  )
}

export function PipelineClient({ investors }: { investors: Investor[] }) {
  const [view, setView] = useState<"kanban" | "list">("kanban")

  const byStage = (stage: string) =>
    investors.filter(inv => inv.profile?.pipelineStage === stage || (!inv.profile && stage === "LEAD"))

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-2">
        <button onClick={() => setView("kanban")} className={`btn btn-sm ${view === "kanban" ? "btn-primary" : "btn-secondary"}`}>
          <LayoutGrid className="h-3.5 w-3.5" />Kanban
        </button>
        <button onClick={() => setView("list")} className={`btn btn-sm ${view === "list" ? "btn-primary" : "btn-secondary"}`}>
          <List className="h-3.5 w-3.5" />List
        </button>
        <span className="ml-auto text-sm" style={{ color: "hsl(var(--text-subtle))" }}>{investors.length} investors</span>
      </div>

      {/* Kanban view */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
          {STAGES.map(stage => {
            const stageInvestors = byStage(stage.key)
            return (
              <div key={stage.key} className="min-w-[220px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
                  <span className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>{stage.label}</span>
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--bg-subtle))", color: "hsl(var(--text-subtle))" }}>{stageInvestors.length}</span>
                </div>
                <div className="space-y-2">
                  {stageInvestors.map(inv => <InvestorCard key={inv.id} investor={inv} />)}
                  {stageInvestors.length === 0 && (
                    <div className="text-xs text-center py-6 rounded-lg border-2 border-dashed" style={{ color: "hsl(var(--text-muted))", borderColor: "hsl(var(--border))" }}>
                      No investors
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Investor</th><th>Stage</th><th>Ticket</th><th>NDA</th><th>Projects</th><th>Tags</th><th></th></tr>
              </thead>
              <tbody>
                {investors.map(inv => {
                  const name = inv.profile ? `${inv.profile.firstName} ${inv.profile.lastName}` : inv.email
                  const stage = STAGES.find(s => s.key === (inv.profile?.pipelineStage ?? "LEAD"))
                  return (
                    <tr key={inv.id}>
                      <td>
                        <p className="font-medium">{name}</p>
                        <p className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{inv.profile?.companyName ?? inv.email}</p>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full" style={{ background: stage?.color }} />
                          <span className="text-xs">{stage?.label}</span>
                        </div>
                      </td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{inv.profile?.estTicket ?? "—"}</td>
                      <td>
                        {inv.latestNdaStatus
                          ? <span className={`badge ${inv.latestNdaStatus === "APPROVED" ? "badge-green" : inv.latestNdaStatus === "PENDING" ? "badge-yellow" : "badge-red"}`}>{inv.latestNdaStatus}</span>
                          : <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>None</span>}
                      </td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{inv.accessGrants.length || "—"}</td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {inv.tags.map(tag => (
                            <span key={tag.id} className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: tag.color + "20", color: tag.color }}>
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <Link href={`/admin/investors/${inv.id}`} className="btn btn-ghost btn-sm">View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
