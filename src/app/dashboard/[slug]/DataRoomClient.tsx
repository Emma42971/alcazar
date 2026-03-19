"use client"

import { useState } from "react"
import { FileText, Download, Eye, MessageSquare, ChevronDown, ChevronUp, Loader2, Clock } from "lucide-react"

type Document = {
  id: string
  name: string
  filePath: string
  fileType: string
  sizeBytes: number | null
  version: number
  createdAt: string
  viewCount: number
}

type Question = {
  id: string
  question: string
  answer: string | null
  answeredAt: string | null
  createdAt: string
}

type Props = {
  project: {
    id: string
    name: string
    summary: string | null
    description: string | null
    logoImage: string | null
  }
  documents: Document[]
  questions: Question[]
  userId: string
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function fileExt(path: string) {
  return path.split(".").pop()?.toUpperCase() ?? "FILE"
}

function fileName(path: string) {
  return path.split("/").pop() ?? path
}

export function DataRoomClient({ project, documents, questions: initialQuestions, userId }: Props) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [qaInput, setQaInput] = useState("")
  const [qaLoading, setQaLoading] = useState(false)
  const [qaError, setQaError] = useState<string | null>(null)
  const [qaSuccess, setQaSuccess] = useState(false)
  const [openTimes, setOpenTimes] = useState<Record<string, number>>({})
  const [descOpen, setDescOpen] = useState(false)

  async function trackOpen(doc: Document) {
    setOpenTimes(p => ({ ...p, [doc.id]: Date.now() }))
    await fetch("/api/track-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: doc.id, projectId: project.id, event: "open" }),
    })
  }

  async function trackClose(docId: string) {
    const start = openTimes[docId]
    if (!start) return
    const durationMs = Date.now() - start
    setOpenTimes(p => { const n = { ...p }; delete n[docId]; return n })
    await fetch("/api/track-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: docId, projectId: project.id, event: "close", durationMs }),
    })
  }

  async function askQuestion() {
    setQaError(null)
    if (!qaInput.trim()) { setQaError("Please enter a question."); return }
    setQaLoading(true)
    const r = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, question: qaInput }),
    })
    const d = await r.json()
    setQaLoading(false)
    if (!r.ok) { setQaError(d.error ?? "Error"); return }
    setQuestions(prev => [{
      id: d.id,
      question: qaInput,
      answer: null,
      answeredAt: null,
      createdAt: new Date().toISOString(),
    }, ...prev])
    setQaInput("")
    setQaSuccess(true)
    setTimeout(() => setQaSuccess(false), 3000)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      {/* Project header */}
      <div className="flex items-start gap-4">
        {project.logoImage && (
          <img src={project.logoImage} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0 border" style={{ borderColor: "hsl(0 0% 14%)" }} />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: "'DM Serif Display',serif" }}>{project.name}</h1>
          {project.summary && <p className="mt-1 text-sm" style={{ color: "hsl(0 0% 50%)" }}>{project.summary}</p>}
          {project.description && (
            <button
              onClick={() => setDescOpen(!descOpen)}
              className="flex items-center gap-1 mt-2 text-xs transition-colors"
              style={{ color: "hsl(0 0% 40%)" }}
            >
              {descOpen ? <><ChevronUp className="h-3 w-3" />Hide description</> : <><ChevronDown className="h-3 w-3" />Read more</>}
            </button>
          )}
          {descOpen && project.description && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "hsl(0 0% 55%)", whiteSpace: "pre-wrap" }}>
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* Data Room */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" style={{ color: "hsl(0 0% 40%)" }} />
          <h2 className="font-medium">Data Room</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(0 0% 10%)", color: "hsl(0 0% 50%)" }}>{documents.length}</span>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm" style={{ color: "hsl(0 0% 35%)" }}>No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => {
              const ext  = fileExt(doc.filePath)
              const size = formatSize(doc.sizeBytes)
              const name = fileName(doc.filePath)
              const fileUrl = `/api/files/${project.id}/${name}`
              const isNew = doc.viewCount === 0

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors"
                  style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "hsl(0 0% 9%)", color: "hsl(0 0% 50%)" }}>
                      {ext}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate" style={{ color: "hsl(0 0% 88%)" }}>{doc.name}</p>
                        {isNew && (
                          <span className="badge badge-new shrink-0" style={{ fontSize: "10px" }}>New</span>
                        )}
                        {doc.version > 1 && (
                          <span className="text-xs" style={{ color: "hsl(0 0% 35%)" }}>v{doc.version}</span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "hsl(0 0% 38%)" }}>
                        {ext}{size ? ` · ${size}` : ""}
                        {doc.viewCount > 0 && ` · viewed ${doc.viewCount}×`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackOpen(doc)}
                      onBlur={() => trackClose(doc.id)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}
                    >
                      <Eye className="h-3 w-3" />
                      <span className="hidden sm:inline">View</span>
                    </a>
                    <a
                      href={`${fileUrl}?download=1`}
                      onClick={() => fetch("/api/track-document", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: doc.id, projectId: project.id, event: "download" }) })}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Q&A */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" style={{ color: "hsl(0 0% 40%)" }} />
          <h2 className="font-medium">Questions & Answers</h2>
        </div>
        <p className="text-sm" style={{ color: "hsl(0 0% 45%)" }}>
          Ask a question about this project. Responses are private — only you can see them.
        </p>

        {/* Ask form */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}>
          <textarea
            value={qaInput}
            onChange={e => setQaInput(e.target.value)}
            placeholder="Your question about this project…"
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 85%)" }}
          />
          {qaError && <p className="text-xs" style={{ color: "hsl(0 72% 65%)" }}>{qaError}</p>}
          {qaSuccess && <p className="text-xs" style={{ color: "hsl(142 71% 55%)" }}>✓ Question sent — we'll respond privately.</p>}
          <button
            onClick={askQuestion}
            disabled={qaLoading || !qaInput.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
            style={{ background: "hsl(0 0% 90%)", color: "hsl(0 0% 5%)", opacity: (qaLoading || !qaInput.trim()) ? 0.5 : 1 }}
          >
            {qaLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Ask Question
          </button>
        </div>

        {/* My questions */}
        {questions.length > 0 && (
          <div className="space-y-3">
            {questions.map(q => (
              <div key={q.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(0 0% 11%)" }}>
                {/* Question */}
                <div className="p-4" style={{ background: "hsl(0 0% 6%)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm" style={{ color: "hsl(0 0% 80%)" }}>{q.question}</p>
                    <span className={`badge shrink-0 text-xs ${q.answer ? "badge-approved" : "badge-pending"}`}>
                      {q.answer ? "Answered" : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "hsl(0 0% 35%)" }}>
                    <Clock className="h-3 w-3" />
                    {new Date(q.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                {/* Answer */}
                {q.answer && (
                  <div className="p-4 border-t" style={{ background: "hsl(0 0% 4.5%)", borderColor: "hsl(0 0% 9%)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "hsl(0 0% 12%)", color: "hsl(0 0% 55%)" }}>A</div>
                      <span className="text-xs font-medium" style={{ color: "hsl(0 0% 50%)" }}>
                        Team response · {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 65%)" }}>{q.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
