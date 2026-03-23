"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, UserPlus, Eye, EyeOff, Shield } from "lucide-react"

const INVESTOR_TYPES = ["Individual", "Family Office", "Institutional", "VC/PE", "Corporate", "Other"]
const TICKET_SIZES   = ["< $100k", "$100k–$500k", "$500k–$1M", "$1M–$5M", "$5M+"]
const COUNTRIES = ["UAE", "Saudi Arabia", "Kuwait", "Qatar", "Bahrain", "Oman", "France", "Switzerland", "United Kingdom", "United States", "Canada", "Germany", "Singapore", "Other"]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
    if (password.length < 8)         { setError("Password must be at least 8 characters"); return }
    if (password !== confirmPassword) { setError("Passwords do not match"); return }
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

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(var(--bg))" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[38%] p-10 relative overflow-hidden shrink-0"
        style={{ background: "hsl(var(--navy))" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 25% 50%, white 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-white"
            style={{ background: "hsl(var(--emerald))" }}>A</div>
          <span className="font-semibold text-white text-lg tracking-tight">Alcazar Capital</span>
        </div>
        <div className="relative z-10 flex-1 flex flex-col justify-center mt-10">
          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
            Join our<br />Investor Network
          </h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Access exclusive investment opportunities in real estate, private equity, and alternative assets.
          </p>
          <div className="mt-8 space-y-3">
            {["NDA-protected data rooms", "Real-time Q&A with deal teams", "Curated deal flow globally"].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--emerald))" }}>
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          © 2026 Alcazar Capital. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-12 space-y-7">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white"
              style={{ background: "hsl(var(--emerald))" }}>A</div>
            <span className="font-semibold" style={{ color: "hsl(var(--text))" }}>Alcazar Capital</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--text))" }}>Request Access</h1>
            <p className="text-sm mt-1.5" style={{ color: "hsl(var(--text-muted))" }}>
              Complete this form to apply for investor portal access.
            </p>
          </div>

          {error && <div className="alert alert-error text-sm">{error}</div>}

          <form onSubmit={submit} className="space-y-6">
            {/* Account */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--text-muted))" }}>Account</h3>
              <div className="field">
                <label className="label">Email address *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className="input" style={{ height: "2.75rem" }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Password (min. 8) *</label>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" className="input" style={{ height: "2.75rem", paddingRight: "2.75rem" }} />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--text-muted))" }}>
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Confirm password *</label>
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••" className="input" style={{ height: "2.75rem", paddingRight: "2.75rem" }} />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--text-muted))" }}>
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal */}
            <div className="space-y-4 pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest pt-2" style={{ color: "hsl(var(--text-muted))" }}>Personal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">First name *</label>
                  <input required value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="John" className="input" style={{ height: "2.75rem" }} />
                </div>
                <div className="field">
                  <label className="label">Last name *</label>
                  <input required value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Smith" className="input" style={{ height: "2.75rem" }} />
                </div>
              </div>
              <div className="field">
                <label className="label">Phone *</label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+971 50 000 0000" className="input" style={{ height: "2.75rem" }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Country *</label>
                  <select value={country} onChange={e => setCountry(e.target.value)} className="input select" style={{ height: "2.75rem" }}>
                    <option value="">Select country…</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">City</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    placeholder="Dubai" className="input" style={{ height: "2.75rem" }} />
                </div>
              </div>
            </div>

            {/* Professional */}
            <div className="space-y-4 pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest pt-2" style={{ color: "hsl(var(--text-muted))" }}>Professional</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Company</label>
                  <input value={companyName} onChange={e => setCompany(e.target.value)}
                    placeholder="Smith Capital" className="input" style={{ height: "2.75rem" }} />
                </div>
                <div className="field">
                  <label className="label">Job title</label>
                  <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                    placeholder="Managing Director" className="input" style={{ height: "2.75rem" }} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Investor type</label>
                  <select value={investorType} onChange={e => setInvestorType(e.target.value)} className="input select" style={{ height: "2.75rem" }}>
                    <option value="">Select…</option>
                    {INVESTOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Estimated ticket size</label>
                  <select value={estTicket} onChange={e => setEstTicket(e.target.value)} className="input select" style={{ height: "2.75rem" }}>
                    <option value="">Select…</option>
                    {TICKET_SIZES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ height: "2.75rem", fontSize: "0.9375rem" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "Submitting…" : "Submit Application"}
            </button>
          </form>

          <div className="flex flex-col gap-3">
            <p className="text-sm text-center" style={{ color: "hsl(var(--text-muted))" }}>
              Already have an account?{" "}
              <Link href="/" style={{ color: "hsl(var(--emerald))", fontWeight: 500 }}>Sign in</Link>
            </p>
            <div className="flex items-center gap-2 justify-center">
              <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                Your information is encrypted and never shared.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
