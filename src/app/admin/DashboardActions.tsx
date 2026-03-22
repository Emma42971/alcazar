"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, X, Loader2, ChevronRight } from "lucide-react"

export function DashboardActions({ pendingInvestors, pendingNdas, openQuestions, pendingKyc }: {
  pendingInvestors: any[]; pendingNdas: any[]; openQuestions: any[]; pendingKyc: any[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const hasActions = pendingInvestors.length > 0 || pendingNdas.length > 0 || openQuestions.length > 0 || pendingKyc.length > 0
  if (!hasActions) return null

  async function approve(type: string, id: string, extra?: any) {
    setLoading(`${type}-${id}`)
    if (type === "investor") await fetch(`/api/admin/investors/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "APPROVED" }) })
    if (type === "nda") await fetch(`/api/admin/nda/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve" }) })
    if (type === "kyc") await fetch(`/api/admin/kyc/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "APPROVED" }) })
    if (type === "qa") await fetch(`/api/admin/questions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: extra?.answer }) })
    setLoading(null); router.refresh()
  }

  async function reject(type: string, id: string) {
    setLoading(`rej-${type}-${id}`)
    if (type === "investor") await fetch(`/api/admin/investors/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "REJECTED" }) })
    if (type === "nda") await fetch(`/api/admin/nda/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject" }) })
    if (type === "kyc") await fetch(`/api/admin/kyc/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "REJECTED" }) })
    setLoading(null); router.refresh()
  }

  const Spinner = ({ id }: { id: string }) => loading === id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Investisseurs en attente */}
      {pendingInvestors.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "hsl(var(--warning))" }} />
              <h3 className="card-title text-sm">Approbations en attente</h3>
              <span className="badge badge-yellow">{pendingInvestors.length}</span>
            </div>
            <Link href="/admin/investors" className="text-xs" style={{ color: "hsl(var(--emerald))" }}>Voir tous →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
            {pendingInvestors.map(inv => {
              const name = inv.profile ? `${inv.profile.firstName} ${inv.profile.lastName}` : inv.email
              return (
                <div key={inv.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "hsl(var(--navy))" }}>{name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--text))" }}>{name}</p>
                    <p className="text-xs truncate" style={{ color: "hsl(var(--text-muted))" }}>{inv.profile?.investorType ?? inv.email}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => approve("investor", inv.id)}
                      disabled={!!loading} className="btn btn-primary btn-sm" style={{ height: "1.75rem", padding: "0 0.625rem" }}>
                      <Spinner id={`investor-${inv.id}`} /><Check className="h-3 w-3" />
                    </button>
                    <button onClick={() => reject("investor", inv.id)}
                      disabled={!!loading} className="btn btn-danger btn-sm" style={{ height: "1.75rem", padding: "0 0.625rem" }}>
                      <Spinner id={`rej-investor-${inv.id}`} /><X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* NDAs en attente */}
      {pendingNdas.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "hsl(var(--blue))" }} />
              <h3 className="card-title text-sm">NDAs en attente</h3>
              <span className="badge badge-blue">{pendingNdas.length}</span>
            </div>
            <Link href="/admin/compliance" className="text-xs" style={{ color: "hsl(var(--emerald))" }}>Voir tous →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
            {pendingNdas.map(nda => {
              const name = nda.user?.profile ? `${nda.user.profile.firstName} ${nda.user.profile.lastName}` : nda.user?.email
              return (
                <div key={nda.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--text))" }}>{name}</p>
                    <p className="text-xs truncate" style={{ color: "hsl(var(--text-muted))" }}>{nda.project?.name}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => approve("nda", nda.id)} disabled={!!loading} className="btn btn-primary btn-sm" style={{ height: "1.75rem", padding: "0 0.625rem" }}>
                      <Spinner id={`nda-${nda.id}`} /><Check className="h-3 w-3" />
                    </button>
                    <button onClick={() => reject("nda", nda.id)} disabled={!!loading} className="btn btn-danger btn-sm" style={{ height: "1.75rem", padding: "0 0.625rem" }}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Q&A ouverts */}
      {openQuestions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "hsl(var(--blue))" }} />
              <h3 className="card-title text-sm">Questions sans réponse</h3>
              <span className="badge badge-blue">{openQuestions.length}</span>
            </div>
            <Link href="/admin/questions" className="text-xs" style={{ color: "hsl(var(--emerald))" }}>Voir tous →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
            {openQuestions.map(q => {
              const name = q.user?.profile ? `${q.user.profile.firstName} ${q.user.profile.lastName}` : q.user?.email
              return (
                <div key={q.id} className="px-4 py-2.5 space-y-2">
                  <p className="text-xs font-medium" style={{ color: "hsl(var(--text))" }}>{q.question.slice(0, 80)}{q.question.length > 80 ? "…" : ""}</p>
                  <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{name} · {q.project?.name}</p>
                  <div className="flex gap-2">
                    <input value={answers[q.id] ?? ""} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                      placeholder="Répondre rapidement…" className="input flex-1" style={{ height: "1.75rem", fontSize: "0.75rem" }} />
                    <button onClick={() => approve("qa", q.id, { answer: answers[q.id] })}
                      disabled={!answers[q.id]?.trim() || !!loading} className="btn btn-primary btn-sm" style={{ height: "1.75rem" }}>
                      <Spinner id={`qa-${q.id}`} /><Check className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* KYC en attente */}
      {pendingKyc.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "hsl(var(--warning))" }} />
              <h3 className="card-title text-sm">KYC à vérifier</h3>
              <span className="badge badge-yellow">{pendingKyc.length}</span>
            </div>
            <Link href="/admin/compliance" className="text-xs" style={{ color: "hsl(var(--emerald))" }}>Voir tous →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
            {pendingKyc.map(kyc => {
              const name = kyc.user?.profile ? `${kyc.user.profile.firstName} ${kyc.user.profile.lastName}` : kyc.user?.email
              return (
                <div key={kyc.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--text))" }}>{name}</p>
                    <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{kyc.docType} · <a href={`/api/files/${kyc.filePath}`} target="_blank" style={{ color: "hsl(var(--emerald))" }}>Voir le doc</a></p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => approve("kyc", kyc.id)} disabled={!!loading} className="btn btn-primary btn-sm" style={{ height: "1.75rem", padding: "0 0.625rem" }}>
                      <Spinner id={`kyc-${kyc.id}`} /><Check className="h-3 w-3" />
                    </button>
                    <button onClick={() => reject("kyc", kyc.id)} disabled={!!loading} className="btn btn-danger btn-sm" style={{ height: "1.75rem", padding: "0 0.625rem" }}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
