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
  const [f, setF] = useState({
    email: "", password: "", confirmPassword: "",
    firstName: "", lastName: "", phone: "",
    companyName: "", country: "", city: "",
    jobTitle: "", investorType: "", estTicket: "",
  })
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (f.password.length < 8)        { setError("Password must be at least 8 characters"); return }
    if (f.password !== f.confirmPassword) { setError("Passwords do not match"); return }
    setLoading(true)
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { setError(d.error ?? "Registration failed"); return }
    router.push("/auth/pending")
  }

  const Field = ({ name, label, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <label className="block text-xs" style={{ color: "hsl(0 0% 50%)" }}>{label}</label>
      <input
        type={type}
        required={["email","password","confirmPassword","firstName","lastName","phone"].includes(name)}
        value={(f as any)[name]}
        onChange={e => set(name, e.target.value)}
        placeholder={placeholder}
        className="alcazar-input"
      />
    </div>
  )

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-16" style={{ background: "hsl(0 0% 3.5%)" }}>
      <div className="w-full max-w-lg space-y-8">
        <div>
          <div className="text-sm mb-6" style={{ color: "hsl(0 0% 40%)" }}>Alcazar Capital</div>
          <h1 className="text-3xl" style={{ fontFamily: "'DM Serif Display',serif" }}>Request Access</h1>
          <p className="mt-2 text-sm" style={{ color: "hsl(0 0% 45%)" }}>
            Complete this form to apply for investor portal access.
          </p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={submit} className="space-y-8">
          {/* Account */}
          <section className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(0 0% 30%)" }}>Account</h3>
            <Field name="email" label="Email address" type="email" placeholder="you@example.com" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field name="password" label="Password (min. 8)" type="password" placeholder="••••••••" />
              <Field name="confirmPassword" label="Confirm password" type="password" placeholder="••••••••" />
            </div>
          </section>

          {/* Personal */}
          <section className="space-y-4 border-t pt-6" style={{ borderColor: "hsl(0 0% 10%)" }}>
            <h3 className="text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(0 0% 30%)" }}>Personal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field name="firstName" label="First name" placeholder="John" />
              <Field name="lastName"  label="Last name"  placeholder="Smith" />
            </div>
            <Field name="phone" label="Phone" type="tel" placeholder="+971 50 000 0000" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field name="country" label="Country" placeholder="UAE" />
              <Field name="city"    label="City"    placeholder="Dubai" />
            </div>
          </section>

          {/* Professional */}
          <section className="space-y-4 border-t pt-6" style={{ borderColor: "hsl(0 0% 10%)" }}>
            <h3 className="text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(0 0% 30%)" }}>Professional</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field name="companyName" label="Company" placeholder="Smith Capital" />
              <Field name="jobTitle"    label="Job title" placeholder="Managing Director" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs" style={{ color: "hsl(0 0% 50%)" }}>Investor type</label>
                <select value={f.investorType} onChange={e => set("investorType", e.target.value)} className="alcazar-input" style={{ appearance: "auto" }}>
                  <option value="">Select…</option>
                  {INVESTOR_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs" style={{ color: "hsl(0 0% 50%)" }}>Estimated ticket size</label>
                <select value={f.estTicket} onChange={e => set("estTicket", e.target.value)} className="alcazar-input" style={{ appearance: "auto" }}>
                  <option value="">Select…</option>
                  {TICKET_SIZES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-opacity"
            style={{ background: "hsl(0 0% 98%)", color: "hsl(0 0% 5%)", opacity: loading ? 0.7 : 1 }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Application
          </button>
        </form>

        <p className="text-sm text-center" style={{ color: "hsl(0 0% 40%)" }}>
          Already have an account?{" "}
          <Link href="/" style={{ color: "hsl(0 0% 70%)", textDecoration: "underline" }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
