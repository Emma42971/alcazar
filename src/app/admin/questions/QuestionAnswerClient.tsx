"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
export function QuestionAnswerClient({ questionId }: { questionId: string }) {
  const router = useRouter(); const [answer, setAnswer] = useState(""); const [loading, setLoading] = useState(false)
  async function submit() {
    if (!answer.trim()) return
    setLoading(true)
    await fetch(`/api/admin/questions/${questionId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer }) })
    setLoading(false); router.refresh()
  }
  return (
    <div className="mt-3 space-y-2">
      <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={3} placeholder="Your answer (visible only to this investor)…" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 14%)", color: "hsl(0 0% 80%)" }}/>
      <button onClick={submit} disabled={loading || !answer.trim()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "hsl(142 71% 45%)", color: "#fff", opacity: (!answer.trim() || loading) ? 0.6 : 1 }}>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}Send Answer
      </button>
    </div>
  )
}
