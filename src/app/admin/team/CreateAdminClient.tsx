"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
export function CreateAdminClient() {
  const router = useRouter(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState<string|null>(null); const [done, setDone] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true)
    const r = await fetch("/api/admin/create-admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
    const d = await r.json(); setLoading(false)
    if (!r.ok) { setError(d.error ?? "Failed"); return }
    setDone(true); setEmail(""); setPassword(""); router.refresh()
  }
  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ background: "hsl(var(--surface))", borderColor: "hsl(var(--border))" }}>
      <h3 className="text-sm font-medium">Add Admin</h3>
      {done && <p className="text-sm" style={{ color: "hsl(142 71% 55%)" }}>Admin created successfully.</p>}
      {error && <div className="alert-error">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="input"/>
        <input required type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 8)" className="input"/>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}Create Admin
        </button>
      </form>
    </div>
  )
}
