"use client"
import { useState, useEffect } from "react"
import { Loader2, Check, Palette, Globe, Type, Lock } from "lucide-react"

const TABS = [
  { id: "general", label: "Général",  icon: Globe },
  { id: "design",  label: "Design",   icon: Palette },
  { id: "auth",    label: "Accès",    icon: Lock },
]

const GENERAL_FIELDS = [
  { key: "portal_name",   label: "Nom du portail",   type: "text",  placeholder: "Alcazar Investor Portal" },
  { key: "company_name",  label: "Nom de la société", type: "text",  placeholder: "Alcazar Capital" },
  { key: "support_email", label: "Email support",     type: "email", placeholder: "support@alcazar.com" },
  { key: "footer_text",   label: "Texte footer",      type: "text",  placeholder: "© 2026 Alcazar Capital." },
  { key: "login_title",   label: "Titre page connexion", type: "text", placeholder: "Investor Portal" },
  { key: "login_subtitle",label: "Sous-titre connexion", type: "text", placeholder: "Secure access to exclusive investment opportunities" },
]

const DESIGN_FIELDS = [
  { key: "brand_color_emerald", label: "Couleur principale (Emerald)", type: "color", default: "#1a7a4a" },
  { key: "brand_color_navy",    label: "Couleur secondaire (Navy)",    type: "color", default: "#1a2a4a" },
  { key: "font_size_base",      label: "Taille de police base (px)",   type: "number", placeholder: "14" },
  { key: "border_radius",       label: "Arrondi des coins",            type: "select", options: ["Carré (0px)", "Petit (4px)", "Normal (8px)", "Large (12px)", "Rond (16px)"] },
  { key: "sidebar_width",       label: "Largeur sidebar",              type: "select", options: ["Compact (180px)", "Normal (200px)", "Large (240px)"] },
  { key: "login_bg_color",      label: "Couleur fond connexion",       type: "color", default: "#1a2a4a" },
  { key: "login_accent_color",  label: "Couleur accent connexion",     type: "color", default: "#1a7a4a" },
]

const AUTH_FIELDS = [
  { key: "require_kyc",         label: "KYC obligatoire",             type: "toggle" },
  { key: "auto_approve_nda",    label: "Auto-approuver les NDAs",     type: "toggle" },
  { key: "session_hours",       label: "Durée de session (heures)",   type: "number", placeholder: "8" },
  { key: "max_login_attempts",  label: "Tentatives max avant blocage", type: "number", placeholder: "10" },
]

export function SettingsClient({ initialSettings }: { initialSettings: Record<string, any> }) {
  const [tab, setTab] = useState("general")
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    DESIGN_FIELDS.forEach(f => { if (f.default) defaults[f.key] = f.default })
    return {
      ...defaults,
      ...Object.fromEntries([...GENERAL_FIELDS, ...DESIGN_FIELDS, ...AUTH_FIELDS].map(f => [f.key, String(initialSettings[f.key] ?? "")]))
    }
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  // Apply design tokens live
  useEffect(() => {
    const r = document.documentElement
    if (values.brand_color_emerald) {
      // Convert hex to HSL and apply
      const h = hexToHSL(values.brand_color_emerald)
      if (h) r.style.setProperty('--emerald', h)
    }
    if (values.brand_color_navy) {
      const h = hexToHSL(values.brand_color_navy)
      if (h) r.style.setProperty('--navy', h)
    }
    if (values.font_size_base) {
      const size = parseInt(values.font_size_base)
      if (size >= 12 && size <= 18) r.style.fontSize = size + 'px'
    }
  }, [values.brand_color_emerald, values.brand_color_navy, values.font_size_base])

  function hexToHSL(hex: string): string | null {
    const r = parseInt(hex.slice(1,3),16)/255
    const g = parseInt(hex.slice(3,5),16)/255
    const b = parseInt(hex.slice(5,7),16)/255
    const max = Math.max(r,g,b), min = Math.min(r,g,b)
    let h=0, s=0, l=(max+min)/2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d/(2-max-min) : d/(max+min)
      switch(max) {
        case r: h=(g-b)/d+(g<b?6:0); break
        case g: h=(b-r)/d+2; break
        case b: h=(r-g)/d+4; break
      }
      h /= 6
    }
    return `${Math.round(h*360)} ${Math.round(s*100)}% ${Math.round(l*100)}%`
  }

  async function save(key: string) {
    setSaving(key)
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: values[key] }),
    })
    setSaving(null); setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  async function saveAll(fields: typeof GENERAL_FIELDS) {
    setSaving("all")
    for (const f of fields) {
      await fetch("/api/admin/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: f.key, value: values[f.key] ?? "" }),
      })
    }
    setSaving(null); setSaved("all")
    setTimeout(() => setSaved(null), 2000)
  }

  function Field({ field }: { field: any }) {
    const isSaved = saved === field.key
    const isSaving = saving === field.key

    return (
      <div className="flex items-start justify-between gap-4 py-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex-1 min-w-0">
          <label className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>{field.label}</label>
          <div className="mt-1.5">
            {field.type === "toggle" ? (
              <button onClick={() => setValues(p => ({ ...p, [field.key]: p[field.key] === "true" ? "false" : "true" }))}
                className="flex items-center gap-2">
                <div className="relative w-9 h-5 rounded-full transition-colors"
                  style={{ background: values[field.key] === "true" ? "hsl(var(--emerald))" : "hsl(var(--border-strong))" }}>
                  <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                    style={{ left: values[field.key] === "true" ? "calc(100% - 18px)" : "2px" }} />
                </div>
                <span className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>
                  {values[field.key] === "true" ? "Activé" : "Désactivé"}
                </span>
              </button>
            ) : field.type === "color" ? (
              <div className="flex items-center gap-3">
                <input type="color" value={values[field.key] || field.default || "#000000"}
                  onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                  className="h-9 w-16 rounded cursor-pointer border"
                  style={{ borderColor: "hsl(var(--border))", padding: "2px" }} />
                <input type="text" value={values[field.key] || field.default || ""}
                  onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                  className="input" style={{ width: 120 }} />
              </div>
            ) : field.type === "select" ? (
              <select value={values[field.key]} onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                className="input select" style={{ width: "auto" }}>
                {(field.options as string[]).map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={field.type} value={values[field.key] ?? ""} placeholder={field.placeholder}
                onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                className="input" style={{ maxWidth: 360 }} />
            )}
          </div>
        </div>
        {field.type !== "toggle" && (
          <button onClick={() => save(field.key)} disabled={!!saving} className="btn btn-primary btn-sm mt-6 shrink-0">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isSaved ? <Check className="h-3.5 w-3.5" /> : "Sauvegarder"}
          </button>
        )}
      </div>
    )
  }

  const currentFields = tab === "general" ? GENERAL_FIELDS : tab === "design" ? DESIGN_FIELDS : AUTH_FIELDS

  return (
    <div className="space-y-5">
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
          </button>
        ))}
      </div>

      {/* Design preview */}
      {tab === "design" && (
        <div className="card card-p space-y-3">
          <h3 className="card-title">Aperçu en temps réel</h3>
          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-primary">Bouton principal</button>
            <button className="btn btn-navy">Bouton navy</button>
            <button className="btn btn-secondary">Bouton secondaire</button>
            <span className="badge badge-green">Approuvé</span>
            <span className="badge badge-yellow">En attente</span>
            <span className="badge badge-blue">Info</span>
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="card card-p">
        <div className="divide-y divide-transparent">
          {currentFields.map(f => <Field key={f.key} field={f} />)}
        </div>
      </div>

      {/* Save all */}
      <button onClick={() => saveAll(currentFields as any)} disabled={saving === "all"} className="btn btn-primary">
        {saving === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : saved === "all" ? <><Check className="h-4 w-4" />Sauvegardé</> : "Tout sauvegarder"}
      </button>
    </div>
  )
}
