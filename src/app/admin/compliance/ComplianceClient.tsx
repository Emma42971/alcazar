"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Loader2, FileCheck, Shield, FileSignature } from "lucide-react"
import Link from "next/link"

const TABS = [
  { id: "nda",   label: "NDAs",         icon: FileCheck },
  { id: "kyc",   label: "KYC / AML",    icon: Shield },
  { id: "esign", label: "E-Signatures", icon: FileSignature },
]

export function ComplianceClient({ ndas, kycs, esigns }: { ndas: any[]; kycs: any[]; esigns: any[] }) {
  const router = useRouter()
  const [tab, setTab] = useState("nda")
  const [loading, setLoading] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  async function action(url: string, body: any, key: string) {
    setLoading(key)
    await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setLoading(null); router.refresh()
  }

  const pendingNdas  = ndas.filter(n => n.status === "PENDING").length
  const pendingKycs  = kycs.filter(k => k.status === "PENDING").length
  const pendingEsign = esigns.filter(e => e.status === "PENDING").length

  return (
    <div className="space-y-5">
      {/* Tabs with badge */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = id === "nda" ? pendingNdas : id === "kyc" ? pendingKycs : pendingEsign
          return (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                color: tab === id ? "hsl(var(--emerald))" : "hsl(var(--text-subtle))",
                borderBottom: tab === id ? "2px solid hsl(var(--emerald))" : "2px solid transparent",
                background: "transparent", marginBottom: -1,
              }}>
              <Icon className="h-4 w-4" />{label}
              {count > 0 && <span className="badge badge-yellow" style={{ fontSize: "0.625rem" }}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* NDA Tab */}
      {tab === "nda" && (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Investisseur</th><th>Projet</th><th>Statut</th><th>Signé par</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {ndas.map(n => {
                const name = n.user?.profile ? `${n.user.profile.firstName} ${n.user.profile.lastName}` : n.user?.email
                return (
                  <tr key={n.id}>
                    <td>
                      <Link href={`/admin/investors/${n.userId}`} className="font-medium hover:underline" style={{ color: "hsl(var(--emerald))" }}>
                        {name}
                      </Link>
                    </td>
                    <td className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>{n.project?.name}</td>
                    <td><span className={`badge ${n.status === "APPROVED" ? "badge-green" : n.status === "REJECTED" ? "badge-red" : "badge-yellow"}`}>{n.status}</span></td>
                    <td className="text-sm">{n.signerFullName ?? "—"}</td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{new Date(n.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td>
                      {n.status === "PENDING" && (
                        <div className="flex gap-1">
                          <button onClick={() => action(`/api/admin/nda/${n.id}`, { action: "approve" }, `nda-${n.id}`)}
                            disabled={!!loading} className="btn btn-primary btn-sm">
                            {loading === `nda-${n.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          </button>
                          <button onClick={() => action(`/api/admin/nda/${n.id}`, { action: "reject" }, `rej-${n.id}`)}
                            disabled={!!loading} className="btn btn-danger btn-sm">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* KYC Tab */}
      {tab === "kyc" && (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Investisseur</th><th>Type</th><th>Fichier</th><th>Statut</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {kycs.map(k => {
                const name = k.user?.profile ? `${k.user.profile.firstName} ${k.user.profile.lastName}` : k.user?.email
                return (
                  <tr key={k.id}>
                    <td>
                      <Link href={`/admin/investors/${k.userId}`} className="font-medium hover:underline" style={{ color: "hsl(var(--emerald))" }}>
                        {name}
                      </Link>
                    </td>
                    <td className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>{k.docType}</td>
                    <td><a href={`/api/files/${k.filePath}`} target="_blank" className="text-xs" style={{ color: "hsl(var(--emerald))" }}>{k.fileName}</a></td>
                    <td><span className={`badge ${k.status === "APPROVED" ? "badge-green" : k.status === "REJECTED" ? "badge-red" : k.status === "PENDING" ? "badge-yellow" : "badge-gray"}`}>{k.status}</span></td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{new Date(k.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td>
                      {k.status === "PENDING" && (
                        <div className="flex gap-1 items-center">
                          <input value={notes[k.id] ?? ""} onChange={e => setNotes(p => ({ ...p, [k.id]: e.target.value }))}
                            placeholder="Note…" className="input" style={{ width: 100, height: "1.75rem", fontSize: "0.75rem" }} />
                          <button onClick={() => action(`/api/admin/kyc/${k.id}`, { status: "APPROVED", adminNote: notes[k.id] }, `kyc-${k.id}`)}
                            disabled={!!loading} className="btn btn-primary btn-sm">
                            {loading === `kyc-${k.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          </button>
                          <button onClick={() => action(`/api/admin/kyc/${k.id}`, { status: "REJECTED", adminNote: notes[k.id] }, `rej-kyc-${k.id}`)}
                            disabled={!!loading} className="btn btn-danger btn-sm">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* E-Sign Tab */}
      {tab === "esign" && (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Investisseur</th><th>Document</th><th>Projet</th><th>Statut</th><th>Envoyé</th><th>Signé</th></tr></thead>
            <tbody>
              {esigns.map(e => {
                const name = e.recipient?.profile ? `${e.recipient.profile.firstName} ${e.recipient.profile.lastName}` : e.recipient?.email
                return (
                  <tr key={e.id}>
                    <td className="font-medium">{name}</td>
                    <td className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>{e.document?.name}</td>
                    <td className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>{e.project?.name}</td>
                    <td><span className={`badge ${e.status === "SIGNED" ? "badge-green" : e.status === "DECLINED" ? "badge-red" : "badge-yellow"}`}>{e.status}</span></td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{new Date(e.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{e.signedAt ? new Date(e.signedAt).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
