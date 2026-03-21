"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
export function NdaActionsClient({ ndaId, status, pdfPath }: { ndaId: string; status: string; pdfPath: string | null }) {
  const router = useRouter(); const [loading, setLoading] = useState(false)
  async function action(act: string) {
    setLoading(true)
    await fetch(`/api/admin/nda/${ndaId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: act }) })
    setLoading(false); router.refresh()
  }
  return (
    <div className="flex gap-2 items-center">
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "hsl(var(--text-subtle))" }} />}
      {status === "PENDING" && <>
        <button onClick={() => action("approve")} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "hsl(142 71% 45% / 0.15)", color: "hsl(142 71% 55%)", border: "1px solid hsl(142 71% 45% / 0.3)" }}>Approve</button>
        <button onClick={() => action("reject")} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "hsl(0 72% 51% / 0.1)", color: "hsl(0 72% 65%)", border: "1px solid hsl(0 72% 51% / 0.25)" }}>Reject</button>
      </>}
      {pdfPath && <a href={pdfPath} target="_blank" className="text-xs px-2 py-1 rounded-lg border" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--text-subtle))" }}>PDF</a>}
    </div>
  )
}
