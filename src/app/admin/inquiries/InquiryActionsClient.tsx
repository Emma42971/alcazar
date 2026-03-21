"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"

export function InquiryActionsClient({ id, adminNote, status }: { id: string; adminNote?: string | null; status: string }) {
  const router = useRouter()
  const [note, setNote] = useState(adminNote ?? "")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(newStatus?: string) {
    setLoading(true)
    await fetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: note, status: newStatus ?? status }),
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-2 pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Internal note…"
        className="input textarea"
        rows={2}
      />
      <div className="flex items-center gap-2">
        <button onClick={() => save()} disabled={loading} className="btn btn-secondary btn-sm">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? "Saved!" : "Save note"}
        </button>
        {status !== "REPLIED" && (
          <button onClick={() => save("REPLIED")} disabled={loading} className="btn btn-primary btn-sm">
            Mark as replied
          </button>
        )}
      </div>
    </div>
  )
}
