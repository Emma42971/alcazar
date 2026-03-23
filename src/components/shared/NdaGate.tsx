"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, PenLine } from "lucide-react"

type Props = {
  project: {
    id: string
    name: string
    ndaText: string | null
    ndaRequired: boolean
  }
  user: { id: string; email: string } | null
  hasAccess: boolean
  ndaStatus: string | null
}

export function NdaGate({ project, user, hasAccess, ndaStatus }: Props) {
  const router = useRouter()
  const [signerName, setSignerName] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drawing, setDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Already has access — no gate needed
  if (hasAccess) return null

  // Not logged in
  if (!user) {
    return (
      <div className="rounded-xl border p-8 text-center space-y-4" style={{ background: "hsl(var(--surface))", borderColor: "hsl(var(--border))" }}>
        <div className="text-4xl">🔒</div>
        <p className="font-medium" style={{ fontFamily: 'inherit' }}>Sign in to access the full project</p>
        <p className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>Create an account or sign in to view documents, financials, and project details.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-4 py-2 rounded-lg text-sm border transition-colors" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--text-subtle))" }}>Sign In</Link>
          <Link href="/auth/register" className="btn btn-secondary">Request Access</Link>
        </div>
      </div>
    )
  }

  // NDA pending
  if (ndaStatus === "PENDING") {
    return (
      <div className="rounded-xl border p-6 space-y-2" style={{ background: "hsl(var(--surface))", borderColor: "hsl(var(--border))" }}>
        <p className="font-medium text-sm">⏳ NDA under review</p>
        <p className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>Your NDA is pending approval. You'll receive an email once access is granted.</p>
      </div>
    )
  }

  // NDA rejected
  if (ndaStatus === "REJECTED") {
    return (
      <div className="rounded-xl border p-6" style={{ background: "hsl(var(--surface))", borderColor: "hsl(0 72% 51% / 0.3)" }}>
        <p className="font-medium text-sm" style={{ color: "hsl(0 72% 65%)" }}>Access not granted</p>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--text-subtle))" }}>Your NDA was not approved. Please contact us for more information.</p>
      </div>
    )
  }

  // Canvas drawing helpers
  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    setDrawing(true)
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const pos = getPos(e)
    lastPos.current = pos
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx || !lastPos.current) return
    const pos = getPos(e)
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "#ffffff"
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    lastPos.current = pos
  }

  function endDraw() { setDrawing(false); lastPos.current = null }

  function clearCanvas() {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
  }

  async function signNda() {
    setError(null)
    if (!signerName.trim()) { setError("Please enter your full name."); return }
    if (!agreed)            { setError("Please agree to the NDA."); return }
    const signatureImg = canvasRef.current?.toDataURL("image/png") ?? null
    setLoading(true)
    const r = await fetch("/api/nda/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, signerName, signatureImg }),
    })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { setError(d.error ?? "Submission failed."); return }
    router.refresh()
  }

  // No NDA required — just request access
  if (!project.ndaRequired) {
    return (
      <div className="rounded-xl border p-6 space-y-4" style={{ background: "hsl(var(--surface))", borderColor: "hsl(var(--border))" }}>
        <p className="font-medium text-sm">Request access to this project</p>
        <p className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>Submit an inquiry and our team will review your request.</p>
        {error && <div className="alert-error">{error}</div>}
        <textarea
          id="inquiry-msg"
          placeholder="Tell us about your interest in this project…"
          rows={3}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
          style={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", color: "hsl(var(--text-subtle))" }}
        />
        <button onClick={async () => {
          const msg = (document.getElementById("inquiry-msg") as HTMLTextAreaElement)?.value
          setLoading(true)
          const r = await fetch("/api/inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, message: msg }) })
          setLoading(false)
          if (r.ok) router.refresh()
        }} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "hsl(var(--surface))", color: "hsl(var(--text-subtle))" }}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}Request Access
        </button>
      </div>
    )
  }

  // NDA sign form
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "hsl(var(--surface))", borderColor: "hsl(var(--border))" }}>
      <div className="flex items-center gap-3 p-5 border-b" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--surface))" }}>
        <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(var(--surface))" }}>
          <PenLine className="h-4 w-4" style={{ color: "hsl(var(--text-subtle))" }} />
        </div>
        <div>
          <p className="text-sm font-medium">Sign NDA to access data room</p>
          <p className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>Your signature will be reviewed before access is granted.</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* NDA text */}
        {project.ndaText && (
          <div className="rounded-lg p-4 h-44 overflow-y-auto text-xs leading-relaxed" style={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", color: "hsl(var(--text-subtle))", whiteSpace: "pre-wrap" }}>
            {project.ndaText}
          </div>
        )}

        {/* Signer name */}
        <div className="space-y-1.5">
          <label className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>Your full name</label>
          <input
            value={signerName}
            onChange={e => setSignerName(e.target.value)}
            placeholder="As it appears on your ID"
            className="input"
          />
        </div>

        {/* Signature canvas */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>Signature</label>
            <button onClick={clearCanvas} className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>Clear</button>
          </div>
          <canvas
            ref={canvasRef}
            width={600}
            height={100}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
            className="w-full rounded-lg cursor-crosshair touch-none"
            style={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", height: "80px" }}
          />
        </div>

        {/* Agree */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-sm leading-snug" style={{ color: "hsl(var(--text-subtle))" }}>
            I have read and agree to the NDA. I understand my submission will be reviewed before access is granted.
          </span>
        </label>

        {error && <div className="alert-error">{error}</div>}

        <button
          onClick={signNda}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-opacity"
          style={{ background: "hsl(var(--surface))", color: "hsl(var(--text-subtle))", opacity: loading ? 0.7 : 1 }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign & Submit NDA
        </button>
      </div>
    </div>
  )
}
