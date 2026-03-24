"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { COUNTRIES } from "@/lib/countries"

const INVESTOR_TYPES = ["Individual", "Family Office", "Institutional", "VC/PE", "Corporate", "Other"]
const TICKET_SIZES   = ["< $100k", "$100k–$500k", "$500k–$1M", "$1M–$5M", "$5M+"]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [showPwd, setShowPwd] = useState(false)

  const [email, setEmail]               = useState("")
  const [password, setPassword]         = useState("")
  const [confirmPassword, setConfirm]   = useState("")
  const [firstName, setFirstName]       = useState("")
  const [lastName, setLastName]         = useState("")
  const [dialCode, setDialCode]         = useState("+971")
  const [phoneNum, setPhoneNum]         = useState("")
  const [companyName, setCompany]       = useState("")
  const [country, setCountry]           = useState("United Arab Emirates")
  const [city, setCity]                 = useState("")
  const [jobTitle, setJobTitle]         = useState("")
  const [investorType, setInvestorType] = useState("")
  const [estTicket, setEstTicket]       = useState("")

  function handleCountryChange(name: string) {
    setCountry(name)
    const c = COUNTRIES.find(c => c.name === name)
    if (c) setDialCode(c.dial)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) { setError("Passwords don't match."); return }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    if (!investorType) { setError("Please select an investor type."); return }

    setLoading(true)
    const phone = `${dialCode} ${phoneNum}`.trim()
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, confirmPassword, firstName, lastName, phone, companyName, country, city, jobTitle, investorType, estTicket }),
    })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { setError(d.error ?? "Registration failed."); return }
    router.push("/auth/pending")
  }

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(var(--bg))" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[40%] p-10 shrink-0" style={{ background: "hsl(var(--navy))" }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ background: "hsl(var(--emerald))" }}>A</div>
          <span className="font-bold text-white text-sm">Alcazar Capital</span>
        </Link>
        <div className="mt-auto space-y-2">
          <h2 className="text-3xl font-bold text-white leading-tight">Join the portal</h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Access exclusive investment opportunities, due diligence materials and manage your portfolio.
          </p>
        </div>
        <p className="mt-10 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>© 2026 Alcazar Capital. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto px-6 py-10">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="btn btn-ghost btn-icon-sm"><ArrowLeft className="h-4 w-4" /></Link>
            <h1 className="text-xl font-bold" style={{ color: "hsl(var(--text))" }}>Request access</h1>
          </div>

          {error && <div className="alert alert-error text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal info */}
            <div className="card card-p space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Personal information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">First name</label>
                  <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" className="input" />
                </div>
                <div className="field">
                  <label className="label">Last name</label>
                  <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" className="input" />
                </div>
              </div>
              <div className="field">
                <label className="label">Email address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="input" autoComplete="email" />
              </div>
              <div className="field">
                <label className="label">Phone number</label>
                <div className="flex gap-2">
                  <select value={dialCode} onChange={e => setDialCode(e.target.value)} className="input select" style={{ width: 110, flexShrink: 0 }}>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
                    ))}
                  </select>
                  <input type="tel" required value={phoneNum} onChange={e => setPhoneNum(e.target.value)} placeholder="50 000 0000" className="input flex-1" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="card card-p space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Location</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Country</label>
                  <select required value={country} onChange={e => handleCountryChange(e.target.value)} className="input select">
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label">City</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="Dubai" className="input" />
                </div>
              </div>
            </div>

            {/* Professional info */}
            <div className="card card-p space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Professional details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Company</label>
                  <input value={companyName} onChange={e => setCompany(e.target.value)} placeholder="Your company" className="input" />
                </div>
                <div className="field">
                  <label className="label">Job title</label>
                  <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Managing Director" className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Investor type <span style={{ color: "hsl(var(--danger))" }}>*</span></label>
                  <select required value={investorType} onChange={e => setInvestorType(e.target.value)} className="input select">
                    <option value="">Select…</option>
                    {INVESTOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Estimated ticket</label>
                  <select value={estTicket} onChange={e => setEstTicket(e.target.value)} className="input select">
                    <option value="">Select…</option>
                    {TICKET_SIZES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="card card-p space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Security</h3>
              <div className="field">
                <label className="label">Password</label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" className="input" style={{ paddingRight: "2.5rem" }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-icon-sm">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="field">
                <label className="label">Confirm password</label>
                <input type="password" required value={confirmPassword} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" className="input" autoComplete="new-password" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ height: "2.75rem" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Submitting…" : "Request access →"}
            </button>

            <p className="text-sm text-center" style={{ color: "hsl(var(--text-muted))" }}>
              Already have access?{" "}
              <Link href="/" style={{ color: "hsl(var(--emerald))", fontWeight: 500 }}>Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
