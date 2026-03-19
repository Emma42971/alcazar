"use client"
import { useState } from "react"
import { Loader2, CheckCircle } from "lucide-react"
export function SettingsClient({ initialSettings }: { initialSettings: Record<string, any> }) {
  const [s, setS] = useState(initialSettings); const [loading, setLoading] = useState(false); const [saved, setSaved] = useState(false)
  async function save(key: string, value: any) {
    setLoading(true)
    await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) })
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
  return (
    <div className="space-y-6">
      {saved && <div className="alert-success flex items-center gap-2"><CheckCircle className="h-4 w-4"/>Saved.</div>}
      {[
        { key: "portal_name", label: "Portal Name", type: "text", placeholder: "Alcazar Investor Portal" },
        { key: "company_name", label: "Company Name", type: "text", placeholder: "Alcazar Capital" },
        { key: "support_email", label: "Support Email", type: "email", placeholder: "support@alcazar.com" },
        { key: "footer_text", label: "Footer Text", type: "text", placeholder: "© 2025 Alcazar Capital. All rights reserved." },
      ].map(field => (
        <div key={field.key} className="rounded-xl border p-5 space-y-3" style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}>
          <label className="text-sm font-medium" style={{ color: "hsl(0 0% 70%)" }}>{field.label}</label>
          <div className="flex gap-2">
            <input type={field.type} value={String(s[field.key] ?? "")} onChange={e => setS(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 85%)" }}/>
            <button onClick={() => save(field.key, s[field.key])} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "hsl(0 0% 90%)", color: "hsl(0 0% 5%)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Save"}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
