"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Globe, Eye, EyeOff, Trash2, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"

const CURRENCIES = ["USD", "EUR", "AED", "GBP", "CHF"]
const REGIONS = ["Dubai/UAE", "Europe", "North America", "Asia Pacific", "Africa", "Latin America", "Global"]

export function ListingsClient({ listings, projects, categories }: {
  listings: any[]; projects: any[]; categories: any[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    projectId: projects[0]?.id ?? "", title: "", shortDesc: "",
    targetReturn: "", minTicketUsd: "", currency: "USD",
    region: "Dubai/UAE", categoryId: ""
  })

  async function create() {
    setLoading("create")
    await fetch("/api/admin/listings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tenantId: projects.find(p => p.id === form.projectId)?.tenantId ?? "",
        targetReturn: form.targetReturn ? parseFloat(form.targetReturn) : null,
        minTicketUsd: form.minTicketUsd ? parseInt(form.minTicketUsd) : null,
        categoryId: form.categoryId || null,
      })
    })
    setLoading(null); setShowForm(false); router.refresh()
  }

  async function toggleStatus(id: string, currentStatus: string) {
    setLoading(id)
    const newStatus = currentStatus === "ACTIVE" ? "DRAFT" : "ACTIVE"
    await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    })
    setLoading(null); router.refresh()
  }

  async function toggleFeatured(id: string, featured: boolean) {
    setLoading(`feat-${id}`)
    await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !featured, featuredUntil: !featured ? new Date(Date.now() + 30 * 86400000).toISOString() : null })
    })
    setLoading(null); router.refresh()
  }

  async function deleteListing(id: string) {
    if (!confirm("Supprimer cette listing ?")) return
    setLoading(`del-${id}`)
    await fetch(`/api/admin/listings/${id}`, { method: "DELETE" })
    setLoading(null); router.refresh()
  }

  return (
    <div className="space-y-5">
      {showForm && (
        <div className="card card-p space-y-4">
          <h3 className="card-title">Nouvelle listing marketplace</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label className="label">Projet</label>
              <select value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))} className="input select">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Catégorie</label>
              <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} className="input select">
                <option value="">Sans catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="field sm:col-span-2">
              <label className="label">Titre</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Luxury Residences — Dubai Marina" className="input" />
            </div>
            <div className="field sm:col-span-2">
              <label className="label">Description courte</label>
              <textarea value={form.shortDesc} onChange={e => setForm(p => ({ ...p, shortDesc: e.target.value }))} rows={2} placeholder="Résumé attractif pour la marketplace (2-3 phrases)" className="input textarea" />
            </div>
            <div className="field">
              <label className="label">Rendement cible (%)</label>
              <input type="number" value={form.targetReturn} onChange={e => setForm(p => ({ ...p, targetReturn: e.target.value }))} placeholder="12.5" className="input" />
            </div>
            <div className="field">
              <label className="label">Ticket minimum</label>
              <input type="number" value={form.minTicketUsd} onChange={e => setForm(p => ({ ...p, minTicketUsd: e.target.value }))} placeholder="50000" className="input" />
            </div>
            <div className="field">
              <label className="label">Devise</label>
              <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="input select">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Région</label>
              <select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="input select">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={!form.title || !form.shortDesc || loading === "create"} className="btn btn-primary btn-sm">
              {loading === "create" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Créer listing
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-secondary btn-sm">Annuler</button>
          </div>
        </div>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
          <Globe className="h-3.5 w-3.5" />Publier sur la marketplace
        </button>
      )}

      <div className="card overflow-hidden">
        {listings.length === 0 ? (
          <div className="p-10 text-center">
            <Globe className="h-10 w-10 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
            <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucun projet publié sur la marketplace</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Titre</th><th>Catégorie</th><th>Rendement</th><th>Min. ticket</th><th>Région</th><th>Vues</th><th>Statut</th><th>Featured</th><th>Actions</th></tr></thead>
            <tbody>
              {listings.map(l => (
                <tr key={l.id}>
                  <td className="font-medium max-w-xs truncate">{l.title}</td>
                  <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{l.category?.name ?? "—"}</td>
                  <td className="text-sm font-semibold" style={{ color: "hsl(var(--emerald))" }}>{l.targetReturn ? `${l.targetReturn}%` : "—"}</td>
                  <td className="text-xs">{l.minTicketUsd ? `${l.currency} ${l.minTicketUsd.toLocaleString()}` : "—"}</td>
                  <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{l.region ?? "—"}</td>
                  <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{l.viewCount}</td>
                  <td>
                    <button onClick={() => toggleStatus(l.id, l.status)} disabled={!!loading} className="cursor-pointer">
                      <span className={`badge ${l.status === "ACTIVE" ? "badge-green" : l.status === "DRAFT" ? "badge-gray" : "badge-yellow"}`}>
                        {l.status}
                      </span>
                    </button>
                  </td>
                  <td>
                    <button onClick={() => toggleFeatured(l.id, l.isFeatured)} disabled={!!loading} className="btn btn-ghost btn-icon-sm">
                      {loading === `feat-${l.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                        l.isFeatured
                          ? <span className="text-yellow-500">★</span>
                          : <span style={{ color: "hsl(var(--text-muted))" }}>☆</span>
                      }
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link href={`/marketplace/${l.seoSlug}`} target="_blank" className="btn btn-ghost btn-icon-sm">
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <button onClick={() => deleteListing(l.id)} disabled={!!loading} className="btn btn-ghost btn-icon-sm">
                        {loading === `del-${l.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
