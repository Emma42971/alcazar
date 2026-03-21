"use client"
import Link from "next/link"
import { Clock } from "lucide-react"
import { useEffect } from "react"

export default function PendingPage() {
  useEffect(() => { document.documentElement.classList.remove("dark") }, [])
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="h-14 w-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "hsl(var(--warning-light))" }}>
          <Clock className="h-7 w-7" style={{ color: "hsl(var(--warning))" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text))", letterSpacing: "-0.025em" }}>Application under review</h1>
          <p className="mt-2 text-sm" style={{ color: "hsl(var(--text-subtle))" }}>
            Your account is pending approval. You'll receive an email once our team has reviewed your application, typically within 1–2 business days.
          </p>
        </div>
        <Link href="/" className="btn btn-secondary inline-flex">← Back to Sign In</Link>
      </div>
    </div>
  )
}
