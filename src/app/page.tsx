"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error === "PENDING") {
      router.push("/auth/pending")
      return
    }
    if (result?.error === "REJECTED") {
      setError("Your account access has been declined.")
      return
    }
    if (result?.error) {
      setError("Invalid email or password.")
      return
    }

    // Check if 2FA needed — middleware handles redirect to /auth/verify-otp
    router.refresh()
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: "hsl(0 0% 5%)", borderRight: "1px solid hsl(0 0% 10%)" }}
      >
        <div className="text-sm font-medium" style={{ color: "hsl(0 0% 40%)" }}>
          Alcazar Capital
        </div>
        <div className="space-y-6">
          <h1 className="text-5xl" style={{ fontFamily: "'DM Serif Display', serif", color: "hsl(0 0% 95%)", lineHeight: 1.1 }}>
            Exclusive access<br />
            <span style={{ color: "hsl(0 0% 45%)", fontStyle: "italic" }}>for qualified</span><br />
            investors
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 40%)", maxWidth: "380px" }}>
            A secure data room for institutional-grade investment opportunities across private equity, real estate, and alternative assets.
          </p>
        </div>
        <div className="text-xs" style={{ color: "hsl(0 0% 25%)" }}>
          All documents are protected and watermarked.
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: "hsl(0 0% 3.5%)" }}>
        <div className="w-full max-w-sm space-y-8">
          <div>
            <div className="lg:hidden text-sm font-medium mb-8" style={{ color: "hsl(0 0% 40%)" }}>
              Alcazar Capital
            </div>
            <h2 className="text-2xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Sign in
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: "hsl(0 0% 45%)" }}>
              Access your investor portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="alert-error">{error}</div>}

            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: "hsl(0 0% 65%)" }}>
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="alcazar-input"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm" style={{ color: "hsl(0 0% 65%)" }}>
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs transition-colors"
                  style={{ color: "hsl(0 0% 40%)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(0 0% 80%)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(0 0% 40%)")}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="alcazar-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "hsl(0 0% 40%)" }}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: "hsl(0 0% 98%)",
                color: "hsl(0 0% 5%)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>

          <p className="text-sm text-center" style={{ color: "hsl(0 0% 40%)" }}>
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="transition-colors"
              style={{ color: "hsl(0 0% 75%)" }}
            >
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
