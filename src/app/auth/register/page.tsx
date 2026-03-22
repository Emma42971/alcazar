"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

const INVESTOR_TYPES = ["Individual", "Family Office", "Institutional", "VC/PE", "Other"]
const TICKET_SIZES   = ["< $100k", "$100k–$500k", "$500k–$1M", "$1M–$5M", "$5M+"]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Chaque champ a son propre useState — évite le re-render global
  const [email, setEmail]               = useState("")
  const [password, setPassword]         = useState("")
  const [confirmPassword, setConfirm]   = useState("")
  const [firstName, setFirstName]       = useState("")
  const [lastName, setLastName]         = useState("")
  const [phone, setPhone]               = useState("")
  const [companyName, setCompany]       = useState("")
  const [country, setCountry]           = useState("")
  const [city, setCity]                 = useState("")
  const [jobTitle, setJobTitle]         = useState("")
  const [investorType, setInvestorType] = useState("")
  const [estTicket, setEstTicket]       = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8)          { setError("Password must be at least 8 characters"); return }
    if (password !== confirmPassword)  { setError("Passwords do not match"); return }
    setLoading(true)
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, confirmPassword, firstName, lastName, phone, companyName, country, city, jobTitle, investorType, estTicket }),
    })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { setError(d.error ?? "Registration failed"); return }
    router.push("/auth/pending")
  }

  const inp = "alcazar-input"
  const sel = "w-full rounded-lg px-3 py-2 text-sm outline-none"
  const selStyle = { background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", color: "hsl(var(--text))", appearance: "auto" as const }
  const label = "block text-xs mb-1.5"
  const labelStyle = { color: "hsl(var(--text-muted))" }

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-16" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-lg space-y-8">
        <div>
          <div className="text-sm mb-6" style={{ color: "hsl(var(--text-muted))" }}>Alcazar Capital</div>
          <h1 className="text-3xl" style={{ fontFamily: 'inherit' }}>Request Access</h1>
          <p className="mt-2 text-sm" style={{ color: "hsl(var(--text-muted))" }}>
            Complete this form to apply for investor portal access.
          </p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={submit} className="space-y-8">
          {/* Account */}
          <section className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(var(--text-muted))" }}>Account</h3>
            <div className="space-y-1.5">
              <label className={label} style={labelStyle}>Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inp} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={label} style={labelStyle}>Password (min. 8)</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className={label} style={labelStyle}>Confirm password</label>
                <input type="password" required value={confirmPassword} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className={inp} />
              </div>
            </div>
          </section>

          {/* Personal */}
          <section className="space-y-4 border-t pt-6" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(var(--text-muted))" }}>Personal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={label} style={labelStyle}>First name</label>
                <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className={label} style={labelStyle}>Last name</label>
                <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" className={inp} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={label} style={labelStyle}>Phone</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 50 000 0000" className={inp} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={label} style={labelStyle}>Country</label>
                <input required value={country} onChange={e => setCountry(e.target.value)} placeholder="UAE" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className={label} style={labelStyle}>City</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Dubai" className={inp} />
              </div>
            </div>
          </section>

          {/* Professional */}
          <section className="space-y-4 border-t pt-6" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(var(--text-muted))" }}>Professional</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={label} style={labelStyle}>Company</label>
                <input value={companyName} onChange={e => setCompany(e.target.value)} placeholder="Smith Capital" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className={label} style={labelStyle}>Job title</label>
                <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Managing Director" className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={label} style={labelStyle}>Investor type</label>
                <select value={investorType} onChange={e => setInvestorType(e.target.value)} className={sel} style={selStyle}>
                  <option value="">Select…</option>
                  {INVESTOR_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={label} style={labelStyle}>Estimated ticket size</label>
                <select value={estTicket} onChange={e => setEstTicket(e.target.value)} className={sel} style={selStyle}>
                  <option value="">Select…</option>
                  {TICKET_SIZES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </section>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-opacity" style={{ background: "hsl(var(--text))", color: "hsl(var(--bg))", opacity: loading ? 0.7 : 1 }}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Application
          </button>
        </form>

        <p className="text-sm text-center" style={{ color: "hsl(var(--text-muted))" }}>
          Already have an account?{" "}
          <Link href="/" style={{ color: "hsl(var(--text))", textDecoration: "underline" }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
