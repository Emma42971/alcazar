"use client"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle } from "lucide-react"
function ResetForm() {
  const router = useRouter(); const token = useSearchParams().get("token")
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState<string|null>(null); const [done, setDone] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    if (password.length<8){setError("Min 8 characters");return} if(password!==confirm){setError("Passwords do not match");return}
    setLoading(true); const r = await fetch("/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,password})}); const d = await r.json(); setLoading(false)
    if (!r.ok){setError(d.error??"Failed");return} setDone(true); setTimeout(()=>router.push("/"),2000)
  }
  if (!token) return <p className="alert-error">Invalid link.</p>
  if (done) return <div className="text-center space-y-4"><CheckCircle className="h-12 w-12 mx-auto" style={{color:"hsl(142 71% 55%)"}}/><p>Password updated. Redirecting…</p></div>
  return <form onSubmit={submit} className="space-y-4">{error&&<div className="alert-error">{error}</div>}<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password (min 8)" className="alcazar-input"/><input type="password" required value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm" className="alcazar-input"/><button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium" style={{background:"hsl(0 0% 98%)",color:"hsl(0 0% 5%)"}}>{loading&&<Loader2 className="h-4 w-4 animate-spin"/>}Set New Password</button></form>
}
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:"hsl(0 0% 3.5%)"}}>
      <div className="w-full max-w-sm space-y-8"><h1 className="text-2xl" style={{fontFamily:"'DM Serif Display',serif"}}>Set new password</h1><Suspense fallback={<div/>}><ResetForm/></Suspense><Link href="/" className="block text-sm text-center" style={{color:"hsl(0 0% 40%)"}}>← Back</Link></div>
    </div>
  )
}
