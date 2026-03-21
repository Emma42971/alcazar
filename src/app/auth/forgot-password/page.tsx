"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { document.documentElement.classList.remove("dark") }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const r = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "request" }),
    })
    setLoading(false)
    if (!r.ok) { setError("Error sending reset email"); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <Link href="/" className="btn btn-ghost btn-sm mb-4"><ArrowLeft className="h-4 w-4" />Back</Link>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text))", letterSpacing: "-0.025em" }}>Reset password</h1>
          <p className="mt-1 text-sm" style={{ color: "hsl(var(--text-subtle))" }}>Enter your email to receive a reset link.</p>
        </div>

        {sent ? (
          <div className="card card-p text-center space-y-3">
            <CheckCircle className="h-10 w-10 mx-auto" style={{ color: "hsl(var(--success))" }} />
            <p className="font-medium" style={{ color: "hsl(var(--text))" }}>Check your email</p>
            <p className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>We sent a reset link to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="field">
              <label className="label">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="input" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
