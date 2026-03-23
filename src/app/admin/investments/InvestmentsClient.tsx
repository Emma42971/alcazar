"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Check, X, Loader2, DollarSign } from "lucide-react"
import Link from "next/link"

const CURRENCIES = ["USD", "EUR", "AED", "GBP", "CHF", "CAD"]

export function InvestmentsClient({ investments, projects, investors }: {
  investments: any[]; projects: any[]; investors: any[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ projectId: projects[0]?.id ?? "", investorId: investors[0]?.id ?? "", amount: "", currency: "USD", wireReference: "", notes: "" })

  async function create() {
    setLoading("create")
    await fetch("/api/admin/investments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount), tenantId: "" })
    })
    setLoading(null); setShowForm(false); router.refresh()
  }

  async function confirm(id: string) {
    setLoading(id)
    await fetch(`/api/admin/investments/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" })
    })
    setLoading(null); router.refresh()
  }

  return (
    <div className="space-y-5">
      {showForm && (
        <div className="card card-p space-y-4">
          <h3 className="card-title">Record Investment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label className="label">Project</label>
              <select value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))} className="input select">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Investor</label>
              <select value={form.investorId} onChange={e => setForm(p => ({ ...p, investorId: e.target.value }))} className="input select">
                {investors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Amount</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="100000" className="input" />
            </div>
            <div className="field">
              <label className="label">Currency</label>
              <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="input select">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Wire Reference</label>
              <input value={form.wireReference} onChange={e => setForm(p => ({ ...p, wireReference: e.target.value }))} placeholder="REF-2026-001" className="input" />
            </div>
            <div className="field">
              <label className="label">Notes</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" className="input" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={!form.amount || !form.projectId || loading === "create"} className="btn btn-primary btn-sm">
              {loading === "create" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Record
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-secondary btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
          <Plus className="h-3.5 w-3.5" />Record Investment
        </button>
      )}

      <div className="card overflow-hidden">
        {investments.length === 0 ? (
          <div className="p-10 text-center">
            <DollarSign className="h-10 w-10 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
            <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>No investments recorded yet</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Investor</th><th>Project</th><th>Amount</th><th>Currency</th><th>Reference</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {investments.map(inv => {
                const investor = investors.find(i => i.id === inv.investorId)
                const project = projects.find(p => p.id === inv.projectId)
                return (
                  <tr key={inv.id}>
                    <td>
                      <Link href={`/admin/investors/${inv.investorId}`} className="font-medium hover:underline" style={{ color: "hsl(var(--emerald))" }}>
                        {investor?.name ?? "Unknown"}
                      </Link>
                    </td>
                    <td className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>{project?.name ?? "Unknown"}</td>
                    <td className="font-semibold">{Number(inv.amount).toLocaleString()}</td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{inv.currency}</td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{inv.wireReference ?? "—"}</td>
                    <td><span className={`badge ${inv.status === "CONFIRMED" ? "badge-green" : inv.status === "CANCELLED" ? "badge-red" : "badge-yellow"}`}>{inv.status}</span></td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td>
                      {inv.status === "PENDING" && (
                        <button onClick={() => confirm(inv.id)} disabled={!!loading} className="btn btn-primary btn-sm">
                          {loading === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}Confirm
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
