"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check, X, Download } from "lucide-react"

export function NdaActionsClient({ id, signedPdfPath }: { id: string; signedPdfPath?: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)

  async function act(action: "approve" | "reject") {
    setLoading(action)
    await fetch(`/api/admin/nda/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {signedPdfPath && (
        <a href={signedPdfPath} target="_blank" className="btn btn-secondary btn-sm btn-icon" title="Download signed NDA">
          <Download className="h-3.5 w-3.5" />
        </a>
      )}
      <button onClick={() => act("approve")} disabled={!!loading} className="btn btn-primary btn-sm">
        {loading === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Approve
      </button>
      <button onClick={() => act("reject")} disabled={!!loading} className="btn btn-danger btn-sm">
        {loading === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Reject
      </button>
    </div>
  )
}
