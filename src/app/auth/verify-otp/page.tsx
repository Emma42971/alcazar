"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
export default function VerifyOtpPage() {
  const router = useRouter()
  const [code, setCode] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState<string|null>(null); const [sent, setSent] = useState(false)
  useEffect(() => { if (!sent) { fetch("/api/auth/send-otp",{method:"POST"}); setSent(true) } }, [])
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true)
    const r = await fetch("/api/auth/verify-otp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})})
    const d = await r.json(); setLoading(false)
    if (!r.ok) { setError(d.error ?? "Invalid code"); return }
    router.push("/dashboard"); router.refresh()
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background: "hsl(var(--surface))"}}>
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="text-4xl">🔐</div>
        <div><h1 className="text-2xl" style={{fontFamily: 'inherit'}}>Check your email</h1><p className="mt-2 text-sm" style={{color: "hsl(var(--text-subtle))"}}>We sent a 6-digit code. Expires in 10 minutes.</p></div>
        {error && <div className="alert-error text-left">{error}</div>}
        <form onSubmit={verify} className="space-y-4">
          <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} maxLength={6} inputMode="numeric" required placeholder="000000" className="alcazar-input text-center text-3xl font-bold tracking-[0.5em]" autoFocus autoComplete="one-time-code"/>
          <button type="submit" disabled={loading||code.length<6} className="btn btn-primary w-full btn-lg">
            {loading&&<Loader2 className="h-4 w-4 animate-spin"/>}Verify
          </button>
        </form>
        <button onClick={()=>fetch("/api/auth/send-otp",{method:"POST"})} className="text-sm" style={{color: "hsl(var(--text-subtle))"}}>Resend code</button>
      </div>
    </div>
  )
}
