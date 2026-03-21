"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, CheckCircle2, Circle, Loader2 } from "lucide-react"

type Item = { id: string; name: string; description: string | null; required: boolean; documentId: string | null; document: { id: string; name: string; status: string } | null }
type Doc  = { id: string; name: string; status: string }

export function DdChecklistClient({ projectId, items, documents }: { projectId: string; items: Item[]; documents: Doc[] }) {
  const router = useRouter()
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [loading, setLoading] = useState(false)

  const fulfilled = items.filter(i => i.documentId && i.document?.status === "PUBLISHED").length
  const total = items.length
  const pct = total ? Math.round((fulfilled / total) * 100) : 0

  async function addItem() {
    if (!newName.trim()) return
    setLoading(true)
    await fetch("/api/admin/checklist", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, name: newName, description: newDesc }),
    })
    setNewName(""); setNewDesc(""); setLoading(false); router.refresh()
  }

  async function linkDoc(itemId: string, docId: string) {
    await fetch(`/api/admin/checklist/${itemId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: docId || null }),
    })
    router.refresh()
  }

  async function deleteItem(id: string) {
    await fetch(`/api/admin/checklist/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="card card-p space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>{fulfilled}/{total} items fulfilled</span>
          <span className="text-sm font-bold" style={{ color: pct === 100 ? "hsl(var(--success))" : "hsl(var(--accent))" }}>{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? "hsl(var(--success))" : "hsl(var(--accent))" }} />
        </div>
      </div>

      {/* Add item */}
      <div className="card card-p space-y-3">
        <h3 className="card-title">Add Checklist Item</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Item name (e.g. Financial Statements 2023)" className="input" />
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" className="input" />
        </div>
        <button onClick={addItem} disabled={loading || !newName.trim()} className="btn btn-primary btn-sm">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add Item
        </button>
      </div>

      {/* Checklist */}
      {items.length === 0 ? (
        <div className="card card-p text-center py-8">
          <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>No checklist items yet. Add items above.</p>
        </div>
      ) : (
        <div className="card">
          <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
            {items.map(item => {
              const done = !!item.documentId && item.document?.status === "PUBLISHED"
              return (
                <div key={item.id} className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 shrink-0">
                    {done
                      ? <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />
                      : <Circle className="h-5 w-5" style={{ color: "hsl(var(--border-strong))" }} />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="font-medium text-sm" style={{ color: "hsl(var(--text))" }}>{item.name}</p>
                      {item.description && <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>{item.description}</p>}
                    </div>
                    <select
                      value={item.documentId ?? ""}
                      onChange={e => linkDoc(item.id, e.target.value)}
                      className="input select"
                      style={{ maxWidth: 280, height: "1.875rem", fontSize: "0.75rem" }}
                    >
                      <option value="">— Link a document —</option>
                      {documents.map(d => <option key={d.id} value={d.id}>{d.name}{d.status === "DRAFT" ? " (draft)" : ""}</option>)}
                    </select>
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="btn btn-ghost btn-icon-sm shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
