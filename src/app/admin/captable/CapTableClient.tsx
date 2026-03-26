"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, PieChart } from "lucide-react"

type Entry = { id: string; investorName: string; amount: number; percentage: number | null; shareClass?: string; entryType: string; notes?: string | null; note?: string | null }

export function CapTableClient({ projectId, entries }: { projectId: string; entries: Entry[] }) {
  const router = useRouter()
  const [name, setName]   = useState("")
  const [amount, setAmount] = useState("")
  const [shareClass, setShareClass] = useState("Common")
  const [entryType, setEntryType]   = useState("equity")
  const [loading, setLoading]       = useState(false)

  const totalAmount = entries.reduce((s, e) => s + e.amount, 0)

  async function add() {
    if (!name.trim() || !amount) return
    setLoading(true)
    await fetch("/api/admin/captable", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, investorName: name, amount: parseInt(amount), entryType })
    })
    setName(""); setAmount(""); setLoading(false); router.refresh()
  }

  async function remove(id: string) {
    await fetch("/api/admin/captable", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Investors", value: entries.length },
          { label: "Total Raised", value: `$${(totalAmount/1000000).toFixed(2)}M` },
          { label: "Equity Investors", value: entries.filter(e => e.entryType === "equity").length },
          { label: "Avg Ticket", value: entries.length ? `$${Math.round(totalAmount/entries.length/1000)}K` : "—" },
        ].map(s => (
          <div key={s.label} className="card card-p">
            <p className="text-xl font-bold" style={{ color: "hsl(var(--text))" }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add entry */}
      <div className="card card-p space-y-3">
        <h3 className="card-title">Add Entry</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Investor name" className="input col-span-2 sm:col-span-1" />
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Amount (USD)" className="input" />
          <select value={shareClass} onChange={e => setShareClass(e.target.value)} className="input select">
            {["Common", "Preferred A", "Preferred B", "Convertible Note", "SAFE"].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={entryType} onChange={e => setEntryType(e.target.value)} className="input select">
            <option value="equity">Equity</option>
            <option value="debt">Debt</option>
            <option value="convertible">Convertible</option>
          </select>
        </div>
        <button onClick={add} disabled={loading || !name.trim() || !amount} className="btn btn-primary btn-sm">
          <Plus className="h-3.5 w-3.5" />Add Investor
        </button>
      </div>

      {/* Table */}
      {entries.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Investor</th><th>Amount</th><th>%</th><th>Class</th><th>Type</th><th></th></tr></thead>
              <tbody>
                {entries.map(e => {
                  const pct = totalAmount > 0 ? ((e.amount / totalAmount) * 100).toFixed(1) : "0"
                  return (
                    <tr key={e.id}>
                      <td className="font-medium">{e.investorName}</td>
                      <td>${e.amount.toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--bg-subtle))" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "hsl(var(--emerald))" }} />
                          </div>
                          <span className="text-xs">{pct}%</span>
                        </div>
                      </td>
                      <td><span className="badge badge-gray">{e.shareClass ?? "—"}</span></td>
                      <td><span className={`badge ${e.entryType === "equity" ? "badge-blue" : "badge-yellow"}`}>{e.entryType}</span></td>
                      <td>
                        <button onClick={() => remove(e.id)} className="btn btn-danger btn-icon-sm">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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
