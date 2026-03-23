"use client"
import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Shield, BarChart2, Lock, TrendingUp } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]     = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { document.documentElement.classList.remove("dark") }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (!res?.ok) {
      if (res?.error === "PENDING") { router.push("/auth/pending"); return }
      setError("Email ou mot de passe incorrect.")
      return
    }
    const me = await fetch("/api/me").then(r => r.json())
    router.push(me?.role === "ADMIN" ? "/admin" : me?.status === "PENDING_APPROVAL" ? "/auth/pending" : "/dashboard")
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[45%] xl:w-[40%] p-10 relative overflow-hidden"
        style={{ background: "hsl(var(--navy))" }}>
        {/* Pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-base"
            style={{ background: "hsl(var(--emerald))" }}>
            <span className="text-white">A</span>
          </div>
          <span className="font-semibold text-white text-lg tracking-tight">Alcazar Capital</span>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center mt-16">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
            Investor<br />Portal
          </h1>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Secure access to exclusive investment opportunities and due diligence materials.
          </p>

          {/* Features */}
          <div className="mt-10 space-y-4">
            {[
              { icon: Shield,    title: "Secure data room",    desc: "NDA-gated access to confidential documents" },
              { icon: BarChart2, title: "Real-time analytics", desc: "Track investor engagement and activity" },
              { icon: TrendingUp,title: "Deal management",     desc: "Pipeline tracking from lead to close" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <Icon className="h-4 w-4" style={{ color: "hsl(var(--emerald))" }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          © 2026 Alcazar Capital. All rights reserved.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: "hsl(var(--bg))" }}>
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white"
              style={{ background: "hsl(var(--emerald))" }}>A</div>
            <span className="font-semibold" style={{ color: "hsl(var(--text))" }}>Alcazar Capital</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--text))" }}>
              Sign in
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: "hsl(var(--text-muted))" }}>
              Enter your credentials to access the portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="alert alert-error text-sm">{error}</div>
            )}

            <div className="field">
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="input"
                style={{ height: "2.75rem", fontSize: "0.9375rem" }}
              />
            </div>

            <div className="field">
              <div className="flex items-center justify-between mb-1">
                <label className="label" style={{ marginBottom: 0 }}>Password</label>
                <Link href="/auth/forgot-password" className="text-xs" style={{ color: "hsl(var(--emerald))" }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input"
                  style={{ height: "2.75rem", fontSize: "0.9375rem", paddingRight: "2.75rem" }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--text-muted))" }}>
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn btn-primary w-full"
              style={{ height: "2.75rem", fontSize: "0.9375rem", marginTop: "0.5rem" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-center" style={{ color: "hsl(var(--text-muted))" }}>
            Don't have access?{" "}
            <Link href="/auth/register" style={{ color: "hsl(var(--emerald))", fontWeight: 500 }}>
              Request access
            </Link>
          </p>

          <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--text-muted))" }} />
            <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
              256-bit SSL encryption · GDPR compliant · SOC 2 ready
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
