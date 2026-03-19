"use client"
import { useState } from "react"
import Link from "next/link"
import { Loader2, CheckCircle } from "lucide-react"
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    await fetch("/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})})
    setLoading(false); setSent(true)
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:"hsl(0 0% 3.5%)"}}>
      <div className="w-full max-w-sm space-y-8">
        <div><h1 className="text-2xl" style={{fontFamily:"'DM Serif Display',serif"}}>Reset password</h1></div>
        {sent?(<div className="text-center space-y-4"><CheckCircle className="h-12 w-12 mx-auto" style={{color:"hsl(142 71% 55%)"}}/><p className="text-sm" style={{color:"hsl(0 0% 60%)"}}>If an account exists for {email}, a reset link has been sent.</p></div>)
        :(<form onSubmit={submit} className="space-y-4"><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="alcazar-input"/><button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium" style={{background:"hsl(0 0% 98%)",color:"hsl(0 0% 5%)"}}>{loading&&<Loader2 className="h-4 w-4 animate-spin"/>}Send Reset Link</button></form>)}
        <Link href="/" className="block text-sm text-center" style={{color:"hsl(0 0% 40%)"}}>← Back to sign in</Link>
      </div>
    </div>
  )
}
