"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Shield } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      if (res.error === "PENDING") setError("Your account is pending approval.")
      else if (res.error === "REJECTED") setError("Your account access has been denied.")
      else setError("Invalid email or password.")
      return
    }
    router.push("/admin")
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden" style={{ background: "#0F1729" }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: "#2563EB", color: "#fff" }}>A</div>
            <span className="text-lg font-semibold text-white">Alcazar</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <div className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "rgba(37,99,235,0.2)", color: "#93C5FD", border: "1px solid rgba(37,99,235,0.3)" }}>
            <Shield className="h-3 w-3" />
            Secure Investor Portal
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight" style={{ letterSpacing: "-0.03em" }}>
            Exclusive access<br />
            <span style={{ color: "#93C5FD" }}>for qualified</span><br />
            investors
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#94A3B8", maxWidth: "340px" }}>
            Institutional-grade data room with dynamic watermarking, granular permissions, and real-time analytics.
          </p>
        </div>

        <div className="relative flex items-center gap-6">
          {[["256-bit", "Encryption"], ["SOC 2", "Compliant"], ["99.9%", "Uptime"]].map(([val, label]) => (
            <div key={label}>
              <p className="text-white font-semibold text-sm">{val}</p>
              <p className="text-xs" style={{ color: "#64748B" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[360px] space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: "#2563EB", color: "#fff" }}>A</div>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Alcazar</span>
          </div>

          <div>
            <h2 className="text-2xl font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Sign in</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Access your investor portal</p>
          </div>

          {error && (
            <div className="alert-error text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Email address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between">
                <label className="label" style={{ margin: 0 }}>Password</label>
                <Link href="/auth/forgot-password" className="text-xs" style={{ color: "var(--blue)" }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link href="/auth/register" style={{ color: "var(--blue)", fontWeight: 500 }}>
              Request access
            </Link>
          </p>

          <p className="text-center text-xs" style={{ color: "var(--text-disabled)" }}>
            Protected by 256-bit encryption
          </p>
        </div>
      </div>
    </div>
  )
}
