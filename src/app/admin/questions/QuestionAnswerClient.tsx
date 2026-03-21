"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"

type Q = {
  id: string; question: string; answer: string | null
  category: string; isShared: boolean
  createdAt: string; answeredAt: string | null
  investorName: string; projectName: string
}

const CAT_COLORS: Record<string, string> = {
  GENERAL: "badge-gray", LEGAL: "badge-purple",
  FINANCIAL: "badge-blue", TECHNICAL: "badge-yellow",
}

export function QuestionAnswerClient({ question: q }: { question: Q }) {
  const router = useRouter()
  const [answer, setAnswer] = useState(q.answer ?? "")
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(!q.answer)

  async function submit() {
    if (!answer.trim()) return
    setLoading(true)
    await fetch(`/api/admin/questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="card">
      <div className="card-p space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ background: "hsl(var(--accent-light))", color: "hsl(var(--accent))" }}>
                {q.investorName.charAt(0)}
              </div>
              <span className="font-medium text-sm" style={{ color: "hsl(var(--text))" }}>{q.investorName}</span>
              <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>·</span>
              <span className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{q.projectName}</span>
              <span className={`badge ${CAT_COLORS[q.category] ?? "badge-gray"}`}>{q.category}</span>
              {q.answer && <span className="badge badge-green">Answered</span>}
            </div>
            <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>{q.question}</p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>
              {new Date(q.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="btn btn-ghost btn-icon-sm shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {expanded && (
          <div className="space-y-3 pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            {q.answer && (
              <div className="rounded-lg p-3 text-sm" style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
                <p className="font-semibold text-xs mb-1">Answer</p>
                <p>{q.answer}</p>
              </div>
            )}
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder={q.answer ? "Edit answer…" : "Write your answer…"}
              className="input textarea"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(var(--text-subtle))" }}>
                <input type="checkbox" defaultChecked={q.isShared}
                  onChange={e => fetch(`/api/admin/questions/${q.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isShared: e.target.checked }) })}
                  className="rounded"
                />
                Visible to all investors (FAQ)
              </label>
              <button onClick={submit} disabled={loading || !answer.trim()} className="btn btn-primary btn-sm">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {q.answer ? "Update" : "Send Answer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
