"use client"
import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Shield, Lock, BarChart2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { document.documentElement.classList.remove("dark") }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (!res?.ok) {
      if (res?.error === "PENDING") { router.push("/auth/pending"); return }
      setError("Invalid email or password.")
      return
    }
    const me = await fetch("/api/me").then(r => r.json())
    if (me?.role === "ADMIN") router.push("/admin")
    else if (me?.needs2fa) router.push("/auth/verify-otp")
    else router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(var(--bg))" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 p-10"
        style={{ background: "hsl(152 57% 38%)" }}>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold bg-white"
            style={{ color: "hsl(152 57% 38%)" }}>A</div>
          <span className="text-white font-semibold text-sm">Alcazar Capital</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white leading-snug" style={{ letterSpacing: "-0.02em" }}>
              Secure Investor<br />Data Room
            </h1>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              Enterprise-grade document management and investor collaboration platform.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Shield, text: "Bank-grade encryption & dynamic watermarking" },
              { icon: Lock, text: "Granular permissions per document & investor" },
              { icon: BarChart2, text: "Real-time activity tracking & audit trails" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          © {new Date().getFullYear()} Alcazar Capital. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-7">
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "hsl(var(--accent))" }}>A</div>
            <span className="font-semibold text-sm" style={{ color: "hsl(var(--text))" }}>Alcazar Capital</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold" style={{ color: "hsl(var(--text))", letterSpacing: "-0.025em" }}>Sign in</h2>
            <p className="mt-1 text-sm" style={{ color: "hsl(var(--text-subtle))" }}>Access your investor portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="alert alert-error text-sm">{error}</div>}

            <div className="field">
              <label className="label">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" className="input" autoComplete="email" />
            </div>

            <div className="field">
              <div className="flex items-center justify-between mb-1">
                <label className="label" style={{ marginBottom: 0 }}>Password</label>
                <Link href="/auth/forgot-password" className="text-xs font-medium" style={{ color: "hsl(var(--accent))" }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="input pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--text-muted))" }}>
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg mt-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign In
            </button>
          </form>

          <p className="text-sm text-center" style={{ color: "hsl(var(--text-subtle))" }}>
            Don't have an account?{" "}
            <Link href="/auth/register" className="font-medium" style={{ color: "hsl(var(--accent))" }}>
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
