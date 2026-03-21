"use client"
import { useState, useCallback } from "react"
import { Loader2, CheckCircle } from "lucide-react"

const FIELDS = [
  { key: "portal_name",    label: "Portal Name",    type: "text",  placeholder: "Alcazar Investor Portal" },
  { key: "company_name",   label: "Company Name",   type: "text",  placeholder: "Alcazar Capital" },
  { key: "support_email",  label: "Support Email",  type: "email", placeholder: "support@alcazar.com" },
  { key: "footer_text",    label: "Footer Text",    type: "text",  placeholder: "© 2025 Alcazar Capital." },
]

export function SettingsClient({ initialSettings }: { initialSettings: Record<string, any> }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map(f => [f.key, String(initialSettings[f.key] ?? "")]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved]   = useState<string | null>(null)

  const handleChange = useCallback((key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }, [])

  async function save(key: string) {
    setSaving(key)
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: values[key] }),
    })
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="space-y-5">
      {FIELDS.map(field => (
        <div key={field.key} className="rounded-xl border p-5 space-y-3" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
          <label className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{field.label}</label>
          <div className="flex gap-2">
            <input
              type={field.type}
              value={values[field.key]}
              onChange={e => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "hsl(var(--input))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
            <button
              onClick={() => save(field.key)}
              disabled={saving === field.key}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
            >
              {saving === field.key
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : saved === field.key
                ? <CheckCircle className="h-4 w-4" />
                : "Save"}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
