"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check, Edit3 } from "lucide-react"
import { COUNTRIES } from "@/lib/countries"

export function ProfileClient({ profile, email }: { profile: any; email: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [phone, setPhone]         = useState(profile?.phone ?? "")
  const [company, setCompany]     = useState(profile?.companyName ?? "")
  const [country, setCountry]     = useState(profile?.country ?? "")
  const [city, setCity]           = useState(profile?.city ?? "")
  const [jobTitle, setJobTitle]   = useState(profile?.jobTitle ?? "")

  async function save() {
    setLoading(true)
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, companyName: company, country, city, jobTitle })
    })
    setLoading(false)
    setSuccess(true)
    setEditing(false)
    setTimeout(() => setSuccess(false), 3000)
    router.refresh()
  }

  const name = profile ? `${profile.firstName} ${profile.lastName}` : email

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg" style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
            <Check className="h-4 w-4" />Updated
          </div>
        )}
      </div>

      {/* Avatar + name */}
      <div className="card card-p flex items-center gap-4">
        <div className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0" style={{ background: "hsl(var(--navy))" }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold" style={{ color: "hsl(var(--text))" }}>{name}</p>
          <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>{email}</p>
          {profile?.investorType && <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>{profile.investorType}</p>}
        </div>
      </div>

      {/* Read-only fields */}
      <div className="card card-p space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Account information</h3>
        {[
          ["Email", email],
          ["First name", profile?.firstName],
          ["Last name", profile?.lastName],
          ["Investor type", profile?.investorType],
          ["Estimated ticket", profile?.estTicket],
        ].filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="flex justify-between py-1.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{k}</span>
            <span className="text-sm" style={{ color: "hsl(var(--text))" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Editable fields */}
      <div className="card card-p space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Contact & location</h3>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">
              <Edit3 className="h-3.5 w-3.5" />Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="field">
              <label className="label">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+971 50 000 0000" />
            </div>
            <div className="field">
              <label className="label">Company</label>
              <input value={company} onChange={e => setCompany(e.target.value)} className="input" placeholder="Your company" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="label">Country</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className="input select">
                  <option value="">Select…</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">City</label>
                <input value={city} onChange={e => setCity(e.target.value)} className="input" placeholder="Dubai" />
              </div>
            </div>
            <div className="field">
              <label className="label">Job title</label>
              <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="input" placeholder="Managing Director" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={save} disabled={loading} className="btn btn-primary">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Save changes
              </button>
              <button onClick={() => setEditing(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              ["Phone", phone],
              ["Company", company],
              ["Country", country],
              ["City", city],
              ["Job title", jobTitle],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{k}</span>
                <span className="text-sm" style={{ color: v ? "hsl(var(--text))" : "hsl(var(--text-muted))" }}>{v || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
