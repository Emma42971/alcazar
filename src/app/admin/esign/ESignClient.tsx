"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, FileSignature } from "lucide-react"

type Req = { id: string; status: string; documentName: string; projectName: string; recipientName: string; createdAt: string; signedAt: string | null }

export function ESignClient({ requests, projects, investors }: { requests: Req[]; projects: {id:string;name:string}[]; investors: {id:string;name:string}[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ projectId: projects[0]?.id ?? "", documentId: "", recipientId: investors[0]?.id ?? "", message: "" })
  const [docs, setDocs] = useState<{id:string;name:string}[]>([])
  const [loading, setLoading] = useState(false)

  async function loadDocs(projectId: string) {
    const r = await fetch(`/api/admin/projects/${projectId}/documents`)
    if (r.ok) setDocs(await r.json())
    setForm(p => ({ ...p, projectId, documentId: "" }))
  }

  async function create() {
    setLoading(true)
    await fetch("/api/admin/esign", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, expiresInDays: 30 })
    })
    setLoading(false); router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="card card-p space-y-4">
        <h3 className="card-title">Send Signature Request</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="field">
            <label className="label">Project</label>
            <select value={form.projectId} onChange={e => loadDocs(e.target.value)} className="input select">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Investor</label>
            <select value={form.recipientId} onChange={e => setForm(p => ({ ...p, recipientId: e.target.value }))} className="input select">
              {investors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label className="label">Message (optional)</label>
          <input value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Please sign this document..." className="input" />
        </div>
        <button onClick={create} disabled={loading || !form.projectId || !form.recipientId} className="btn btn-primary btn-sm">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Send Request
        </button>
      </div>

      <div className="card overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-10 text-center">
            <FileSignature className="h-10 w-10 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
            <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>No signature requests sent yet</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Recipient</th><th>Document</th><th>Project</th><th>Status</th><th>Sent</th><th>Signed</th></tr></thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td className="font-medium">{r.recipientName}</td>
                  <td style={{ color: "hsl(var(--text-subtle))" }}>{r.documentName}</td>
                  <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{r.projectName}</td>
                  <td><span className={`badge ${r.status === "SIGNED" ? "badge-green" : r.status === "DECLINED" ? "badge-red" : "badge-yellow"}`}>{r.status}</span></td>
                  <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{r.signedAt ? new Date(r.signedAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
