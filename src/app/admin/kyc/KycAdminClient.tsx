"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, FileText, Loader2, Eye } from "lucide-react"

type KycRec = { id: string; userId: string; name: string; email: string; status: string; idDocPath: string | null; idDocType: string | null; addressDocPath: string | null; reviewNote: string | null; submittedAt: string | null }

export function KycAdminClient({ records }: { records: KycRec[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [note, setNote] = useState<Record<string, string>>({})

  async function review(id: string, action: "approve" | "reject") {
    setLoading(id + action)
    await fetch("/api/admin/kyc", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, reviewNote: note[id] }),
    })
    setLoading(null)
    router.refresh()
  }

  if (records.length === 0) return (
    <div className="card card-p text-center py-12">
      <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(var(--text-muted))" }} />
      <p className="font-medium">No KYC submissions yet</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {records.map(r => (
        <div key={r.id} className="card card-p space-y-3"
          style={{ borderLeft: r.status === "PENDING" ? "3px solid hsl(var(--warning))" : r.status === "APPROVED" ? "3px solid hsl(var(--emerald))" : "3px solid hsl(var(--danger))" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{r.name}</p>
                <span className={`badge ${r.status === "APPROVED" ? "badge-green" : r.status === "PENDING" ? "badge-yellow" : "badge-red"}`}>{r.status}</span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>{r.email}</p>
              {r.submittedAt && <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>Submitted: {new Date(r.submittedAt).toLocaleDateString()}</p>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {r.idDocPath && (
                <a href={`/api/files/${r.idDocPath}`} target="_blank" className="btn btn-secondary btn-sm">
                  <Eye className="h-3.5 w-3.5" />ID Doc
                </a>
              )}
              {r.addressDocPath && (
                <a href={`/api/files/${r.addressDocPath}`} target="_blank" className="btn btn-secondary btn-sm">
                  <Eye className="h-3.5 w-3.5" />Address Doc
                </a>
              )}
            </div>
          </div>
          {r.status === "PENDING" && (
            <div className="flex items-center gap-3 pt-2 flex-wrap" style={{ borderTop: "1px solid hsl(var(--border))" }}>
              <input value={note[r.id] ?? ""} onChange={e => setNote(prev => ({ ...prev, [r.id]: e.target.value }))}
                placeholder="Review note (optional)" className="input flex-1" style={{ minWidth: 200 }} />
              <button onClick={() => review(r.id, "approve")} disabled={!!loading} className="btn btn-primary btn-sm">
                {loading === r.id + "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                Approve
              </button>
              <button onClick={() => review(r.id, "reject")} disabled={!!loading} className="btn btn-danger btn-sm">
                {loading === r.id + "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Reject
              </button>
            </div>
          )}
          {r.reviewNote && <p className="text-sm p-2 rounded" style={{ background: "hsl(var(--bg-subtle))", color: "hsl(var(--text-subtle))" }}>Note: {r.reviewNote}</p>}
        </div>
      ))}
    </div>
  )
}
