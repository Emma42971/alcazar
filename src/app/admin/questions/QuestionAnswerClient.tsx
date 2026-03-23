"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send, ChevronDown, ChevronUp, Paperclip, MessageSquare, X } from "lucide-react"

type Q = {
  id: string; question: string; answer: string | null
  category: string; status: string; isShared: boolean
  createdAt: string; answeredAt: string | null
  investorName: string; projectName: string
  followUps: { id: string; question: string; answer: string | null; investorName: string; createdAt: string }[]
  attachments: { id: string; fileName: string; filePath: string }[]
}

const CAT_COLORS: Record<string, string> = {
  GENERAL: "badge-gray", LEGAL: "badge-purple", FINANCIAL: "badge-blue", TECHNICAL: "badge-yellow"
}
const STATUS_COLORS: Record<string, string> = {
  OPEN: "badge-yellow", ANSWERED: "badge-green", CLOSED: "badge-gray", REJECTED: "badge-red"
}

export function QuestionAnswerClient({ question: q }: { question: Q }) {
  const router = useRouter()
  const [answer, setAnswer]   = useState(q.answer ?? "")
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(!q.answer)

  async function updateAnswer() {
    if (!answer.trim()) return
    setLoading(true)
    await fetch(`/api/admin/questions/${q.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, status: "ANSWERED" }),
    })
    setLoading(false); router.refresh()
  }

  async function setStatus(status: string) {
    await fetch(`/api/admin/questions/${q.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  return (
    <div className="card" style={{ borderLeft: q.status === "OPEN" ? "3px solid hsl(var(--warning))" : "1px solid hsl(var(--border))" }}>
      <div className="card-p space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ background: "hsl(var(--accent-light))", color: "hsl(var(--accent))" }}>
                {q.investorName.charAt(0)}
              </div>
              <span className="font-medium text-sm">{q.investorName}</span>
              <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>· {q.projectName}</span>
              <span className={`badge ${CAT_COLORS[q.category] ?? "badge-gray"}`}>{q.category}</span>
              <span className={`badge ${STATUS_COLORS[q.status] ?? "badge-gray"}`}>{q.status}</span>
              {q.followUps.length > 0 && (
                <span className="badge badge-gray"><MessageSquare className="h-3 w-3" />{q.followUps.length}</span>
              )}
            </div>
            <p className="text-sm font-medium">{q.question}</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
              {new Date(q.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="btn btn-ghost btn-icon-sm shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {expanded && (
          <div className="space-y-3 pt-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            {/* Existing answer */}
            {q.answer && (
              <div className="rounded-lg p-3 text-sm" style={{ background: "hsl(var(--success-light))" }}>
                <p className="font-semibold text-xs mb-1" style={{ color: "hsl(var(--success))" }}>Answer</p>
                <p style={{ color: "hsl(var(--success))" }}>{q.answer}</p>
              </div>
            )}

            {/* Attachments */}
            {q.attachments.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {q.attachments.map(a => (
                  <a key={a.id} href={`/api/files/${a.filePath}`} target="_blank"
                    className="flex items-center gap-1.5 text-xs px-2 py-1 rounded" style={{ background: "hsl(var(--bg-subtle))", color: "hsl(var(--text-subtle))" }}>
                    <Paperclip className="h-3 w-3" />{a.fileName}
                  </a>
                ))}
              </div>
            )}

            {/* Follow-ups */}
            {q.followUps.length > 0 && (
              <div className="space-y-2">
                {q.followUps.map(fu => (
                  <div key={fu.id} className="pl-4 border-l-2 space-y-1" style={{ borderColor: "hsl(var(--border-strong))" }}>
                    <p className="text-xs font-medium">{fu.investorName} (follow-up)</p>
                    <p className="text-sm">{fu.question}</p>
                    {fu.answer && <p className="text-sm" style={{ color: "hsl(var(--success))" }}>→ {fu.answer}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Answer textarea */}
            <textarea value={answer} onChange={e => setAnswer(e.target.value)}
              placeholder={q.answer ? "Edit answer…" : "Write your answer…"}
              className="input textarea" rows={3} />

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: "hsl(var(--text-subtle))" }}>
                  <input type="checkbox" defaultChecked={q.isShared}
                    onChange={e => fetch(`/api/admin/questions/${q.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isShared: e.target.checked }) })} />
                  Shared (FAQ)
                </label>
                {q.status !== "CLOSED" && (
                  <button onClick={() => setStatus("CLOSED")} className="btn btn-ghost btn-sm" style={{ color: "hsl(var(--text-muted))" }}>
                    Close
                  </button>
                )}
                {q.status !== "REJECTED" && (
                  <button onClick={() => setStatus("REJECTED")} className="btn btn-danger btn-sm">Reject</button>
                )}
              </div>
              <button onClick={updateAnswer} disabled={loading || !answer.trim()} className="btn btn-primary btn-sm">
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
