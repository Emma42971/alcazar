"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Eye, Lock, AlertTriangle, Globe, Clock, Save, Loader2 } from "lucide-react"

const TABS = [
  { id: "config",  label: "Configuration", icon: Shield },
  { id: "rules",   label: "Règles d'accès", icon: Lock },
  { id: "events",  label: "Logs sécurité",  icon: AlertTriangle },
]

const PERMISSION_LEVELS = [
  { value: "NONE",               label: "Aucun accès" },
  { value: "FENCE_VIEW",        label: "Fence View (anti-screenshot)" },
  { value: "VIEW",              label: "Lecture seule" },
  { value: "DOWNLOAD_ENCRYPTED",label: "Télécharger (chiffré)" },
  { value: "PRINT",             label: "Imprimer" },
  { value: "DOWNLOAD_PDF",      label: "Télécharger PDF" },
  { value: "DOWNLOAD_ORIGINAL", label: "Télécharger original" },
  { value: "UPLOAD",            label: "Upload" },
]

const SEVERITY_COLORS: Record<string, string> = {
  info: "badge-gray", warn: "badge-yellow", error: "badge-red", critical: "badge-red"
}

export function SecurityClient({ projects, events, accessRules }: {
  projects: any[]; events: any[]; accessRules: any[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState("config")
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id ?? "")
  const [config, setConfig] = useState({
    requireMfa: false, deviceBinding: false, watermarkAll: false,
    allowScreenshot: true, sessionMaxHours: 8,
    ipWhitelist: "", ipBlacklist: "", countryBlacklist: ""
  })
  const [rule, setRule] = useState({
    documentId: "", permissionLevel: "VIEW",
    enableFenceView: false, maxViews: "",
    accessStartAt: "", accessEndAt: "", watermarkText: ""
  })

  async function saveConfig() {
    setLoading(true)
    await fetch("/api/admin/security", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: selectedProject,
        requireMfa: config.requireMfa,
        deviceBinding: config.deviceBinding,
        watermarkAll: config.watermarkAll,
        allowScreenshot: config.allowScreenshot,
        sessionMaxHours: parseInt(config.sessionMaxHours as any),
        ipWhitelist: config.ipWhitelist ? config.ipWhitelist.split("\n").map(s => s.trim()).filter(Boolean) : null,
        ipBlacklist: config.ipBlacklist ? config.ipBlacklist.split("\n").map(s => s.trim()).filter(Boolean) : null,
        countryBlacklist: config.countryBlacklist ? config.countryBlacklist.split(",").map(s => s.trim()).filter(Boolean) : null,
      })
    })
    setLoading(false); router.refresh()
  }

  const highEvents = events.filter(e => e.severity === "error" || e.severity === "critical")

  return (
    <div className="space-y-5">
      {highEvents.length > 0 && (
        <div className="alert alert-error">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{highEvents.length} événements critiques détectés. Vérifiez les logs de sécurité.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              color: tab === id ? "hsl(var(--emerald))" : "hsl(var(--text-subtle))",
              borderBottom: tab === id ? "2px solid hsl(var(--emerald))" : "2px solid transparent",
              background: "transparent", marginBottom: -1,
            }}>
            <Icon className="h-4 w-4" />{label}
            {id === "events" && highEvents.length > 0 && (
              <span className="badge badge-red">{highEvents.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Config */}
      {tab === "config" && (
        <div className="space-y-5">
          <div className="card card-p space-y-4">
            <div className="flex items-center gap-3">
              <label className="label" style={{ marginBottom: 0 }}>Projet</label>
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="input select" style={{ width: "auto" }}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="card card-p space-y-5">
            <h3 className="card-title">🔐 Contrôles d'accès</h3>
            {[
              { key: "requireMfa",      label: "Exiger MFA pour accéder",         desc: "Les investisseurs devront valider avec un code 2FA" },
              { key: "deviceBinding",   label: "Liaison appareil",                desc: "Bloquer la connexion depuis un nouvel appareil non reconnu" },
              { key: "watermarkAll",    label: "Watermark automatique",           desc: "Apposer le nom de l'investisseur sur tous les PDFs" },
              { key: "allowScreenshot", label: "Autoriser les captures d'écran",  desc: "Désactiver pour activer la protection anti-screenshot" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>{desc}</p>
                </div>
                <button onClick={() => setConfig(p => ({ ...p, [key]: !p[key as keyof typeof p] }))} className="shrink-0">
                  <div className="relative w-9 h-5 rounded-full transition-colors"
                    style={{ background: (config as any)[key] ? "hsl(var(--emerald))" : "hsl(var(--border-strong))" }}>
                    <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                      style={{ left: (config as any)[key] ? "calc(100% - 18px)" : "2px" }} />
                  </div>
                </button>
              </div>
            ))}

            <div className="field">
              <label className="label">Durée de session max (heures)</label>
              <input type="number" value={config.sessionMaxHours} onChange={e => setConfig(p => ({ ...p, sessionMaxHours: parseInt(e.target.value) }))}
                className="input" style={{ width: 120 }} min={1} max={72} />
            </div>
          </div>

          <div className="card card-p space-y-4">
            <h3 className="card-title">🌐 Restrictions IP / Pays</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field">
                <label className="label">IP whitelist (une par ligne)</label>
                <textarea value={config.ipWhitelist} onChange={e => setConfig(p => ({ ...p, ipWhitelist: e.target.value }))}
                  placeholder={"192.168.1.\n10.0.0."} className="input textarea" rows={4} />
                <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Vide = tous les IPs autorisés</p>
              </div>
              <div className="field">
                <label className="label">IP blacklist (une par ligne)</label>
                <textarea value={config.ipBlacklist} onChange={e => setConfig(p => ({ ...p, ipBlacklist: e.target.value }))}
                  placeholder={"1.2.3.4\n5.6.7."} className="input textarea" rows={4} />
              </div>
            </div>
            <div className="field">
              <label className="label">Pays bloqués (codes ISO, ex: RU,CN,KP)</label>
              <input value={config.countryBlacklist} onChange={e => setConfig(p => ({ ...p, countryBlacklist: e.target.value }))}
                placeholder="RU, CN, KP" className="input" style={{ maxWidth: 300 }} />
            </div>
          </div>

          <button onClick={saveConfig} disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Sauvegarder la configuration
          </button>
        </div>
      )}

      {/* Access Rules */}
      {tab === "rules" && (
        <div className="space-y-4">
          <div className="card card-p space-y-4">
            <h3 className="card-title">Nouvelle règle d'accès document</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="field">
                <label className="label">Document ID</label>
                <input value={rule.documentId} onChange={e => setRule(p => ({ ...p, documentId: e.target.value }))} placeholder="doc_xxx" className="input" />
              </div>
              <div className="field">
                <label className="label">Niveau de permission</label>
                <select value={rule.permissionLevel} onChange={e => setRule(p => ({ ...p, permissionLevel: e.target.value }))} className="input select">
                  {PERMISSION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Accès depuis</label>
                <input type="datetime-local" value={rule.accessStartAt} onChange={e => setRule(p => ({ ...p, accessStartAt: e.target.value }))} className="input" />
              </div>
              <div className="field">
                <label className="label">Accès jusqu'au</label>
                <input type="datetime-local" value={rule.accessEndAt} onChange={e => setRule(p => ({ ...p, accessEndAt: e.target.value }))} className="input" />
              </div>
              <div className="field">
                <label className="label">Vues maximum</label>
                <input type="number" value={rule.maxViews} onChange={e => setRule(p => ({ ...p, maxViews: e.target.value }))} placeholder="Illimité" className="input" />
              </div>
              <div className="field">
                <label className="label">Texte watermark</label>
                <input value={rule.watermarkText} onChange={e => setRule(p => ({ ...p, watermarkText: e.target.value }))} placeholder="CONFIDENTIEL - {nom}" className="input" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setRule(p => ({ ...p, enableFenceView: !p.enableFenceView }))}>
                <div className="relative w-9 h-5 rounded-full transition-colors"
                  style={{ background: rule.enableFenceView ? "hsl(var(--emerald))" : "hsl(var(--border-strong))" }}>
                  <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                    style={{ left: rule.enableFenceView ? "calc(100% - 18px)" : "2px" }} />
                </div>
              </button>
              <span className="text-sm" style={{ color: "hsl(var(--text))" }}>Activer Fence View (anti-screenshot)</span>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="card-header"><h3 className="card-title">Règles actives ({accessRules.length})</h3></div>
            {accessRules.length === 0 ? (
              <div className="p-8 text-center"><p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucune règle configurée</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Document</th><th>Permission</th><th>Fence View</th><th>Expire</th><th>Max vues</th></tr></thead>
                <tbody>
                  {accessRules.map(r => (
                    <tr key={r.id}>
                      <td className="text-xs font-mono" style={{ color: "hsl(var(--text-muted))" }}>{r.documentId.slice(0, 12)}…</td>
                      <td><span className="badge badge-blue">{r.permissionLevel}</span></td>
                      <td>{r.enableFenceView ? <span className="badge badge-emerald">Actif</span> : <span className="badge badge-gray">Non</span>}</td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{r.accessEndAt ? new Date(r.accessEndAt).toLocaleDateString() : "—"}</td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{r.maxViews ?? "∞"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Security Events */}
      {tab === "events" && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="card-title">Logs de sécurité</h3>
            <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{events.length} événements récents</span>
          </div>
          {events.length === 0 ? (
            <div className="p-8 text-center"><p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucun événement</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Type</th><th>User</th><th>Pays</th><th>Sévérité</th><th>Détails</th></tr></thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id}>
                    <td className="text-xs whitespace-nowrap" style={{ color: "hsl(var(--text-muted))" }}>
                      {new Date(e.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td><span className="badge badge-gray text-xs">{e.type}</span></td>
                    <td className="text-xs font-mono" style={{ color: "hsl(var(--text-muted))" }}>{e.userId?.slice(0, 8) ?? "—"}…</td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{e.country ?? "—"}</td>
                    <td><span className={`badge text-xs ${SEVERITY_COLORS[e.severity] ?? "badge-gray"}`}>{e.severity}</span></td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                      {e.details ? JSON.stringify(e.details).slice(0, 50) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
