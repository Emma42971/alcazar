"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
export function InquiryActionsClient({ inquiryId, currentStatus, adminNote }: { inquiryId: string; currentStatus: string; adminNote: string | null }) {
  const router = useRouter(); const [note, setNote] = useState(adminNote ?? ""); const [loading, setLoading] = useState(false)
  async function update(status: string) {
    setLoading(true)
    await fetch(`/api/admin/inquiries/${inquiryId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, adminNote: note || null }) })
    setLoading(false); router.refresh()
  }
  if (currentStatus === "REPLIED") return adminNote ? <p className="text-xs italic" style={{ color: "hsl(0 0% 40%)" }}>Note: {adminNote}</p> : null
  return (
    <div className="space-y-2 pt-2 border-t" style={{ borderColor: "hsl(0 0% 10%)" }}>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Internal note (optional)…" className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none" style={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 14%)", color: "hsl(0 0% 70%)" }}/>
      <div className="flex gap-2">
        {currentStatus === "NEW" && <button onClick={() => update("READ")} disabled={loading} className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}>Mark Read</button>}
        <button onClick={() => update("REPLIED")} disabled={loading} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "hsl(142 71% 45% / 0.15)", color: "hsl(142 71% 55%)", border: "1px solid hsl(142 71% 45% / 0.3)" }}>Mark Replied</button>
      </div>
    </div>
  )
}
