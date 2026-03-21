"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Check, X, Loader2 } from "lucide-react"

type Doc = { id: string; docType: string; fileName: string; filePath: string; status: string; adminNote: string | null; createdAt: string; investorName: string; userId: string }

export function KycClient({ docs }: { docs: Doc[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [note, setNote] = useState<Record<string, string>>({})

  async function review(id: string, status: string) {
    setLoading(id)
    await fetch(`/api/admin/kyc/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: note[id] ?? null })
    })
    setLoading(null); router.refresh()
  }

  if (docs.length === 0) return (
    <div className="card card-p text-center py-12">
      <Shield className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(var(--text-muted))" }} />
      <p className="font-medium">No KYC documents submitted</p>
    </div>
  )

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Investor</th><th>Document Type</th><th>File</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
          <tbody>
            {docs.map(d => (
              <tr key={d.id}>
                <td className="font-medium">{d.investorName}</td>
                <td style={{ color: "hsl(var(--text-subtle))" }}>{d.docType}</td>
                <td>
                  <a href={`/api/files/${d.filePath}`} target="_blank" className="text-xs" style={{ color: "hsl(var(--emerald))" }}>
                    {d.fileName}
                  </a>
                </td>
                <td>
                  <span className={`badge ${d.status === "APPROVED" ? "badge-green" : d.status === "REJECTED" ? "badge-red" : "badge-yellow"}`}>
                    {d.status}
                  </span>
                </td>
                <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                <td>
                  {d.status === "PENDING" && (
                    <div className="flex items-center gap-2">
                      <input value={note[d.id] ?? ""} onChange={e => setNote(p => ({ ...p, [d.id]: e.target.value }))} placeholder="Note (optional)" className="input" style={{ width: 160, height: "1.75rem", fontSize: "0.75rem" }} />
                      <button onClick={() => review(d.id, "APPROVED")} disabled={loading === d.id} className="btn btn-primary btn-sm">
                        {loading === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Approve
                      </button>
                      <button onClick={() => review(d.id, "REJECTED")} disabled={loading === d.id} className="btn btn-danger btn-sm">
                        <X className="h-3.5 w-3.5" />Reject
                      </button>
                    </div>
                  )}
                  {d.status !== "PENDING" && <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{d.adminNote ?? "Reviewed"}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
