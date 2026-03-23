"use client"
import { useState, useEffect } from "react"
import { FolderOpen, FileText, Lock, Download, Eye, MessageSquare, Send, Loader2, Shield, BookOpen } from "lucide-react"

const FOLDER_ICONS: Record<string, string> = {
  "financials": "💰",
  "financial": "💰",
  "legal": "⚖️",
  "legal documents": "⚖️",
  "technical": "⚙️",
  "technical specs": "⚙️",
  "marketing": "📢",
  "marketing material": "📢",
  "reports": "📊",
  "presentations": "📑",
}

type Folder   = { id: string; name: string; index: string; parentId: string | null }
type Doc      = { id: string; name: string; fileType: string; filePath: string; sizeBytes: number | null; label: string; allowDownload: boolean; folderId: string | null; projectId: string }
type Activity = { id: string; userId: string; investorName: string; documentName: string; event: string; viewedAt: string }
type Question = { id: string; question: string; answer: string | null; category: string; createdAt: string }

export function DataRoomClient({
  projectId, projectName, projectSlug, folders, documents, recentActivity, questions, userId
}: {
  projectId: string; projectName: string; projectSlug: string
  folders: Folder[]; documents: Doc[]; recentActivity: Activity[]; questions: Question[]; userId: string
}) {
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [qaText, setQaText] = useState("")
  const [qaLoading, setQaLoading] = useState(false)
  const [qaSuccess, setQaSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<"files" | "activity" | "qa">("files")

  // Track document open
  async function trackOpen(docId: string) {
    await fetch("/api/track-document", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: docId, projectId, event: "open" })
    })
  }

  async function submitQuestion() {
    if (!qaText.trim()) return
    setQaLoading(true)
    await fetch("/api/questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, question: qaText, category: "GENERAL" })
    })
    setQaLoading(false); setQaSuccess(true); setQaText("")
    setTimeout(() => setQaSuccess(false), 3000)
  }

  const displayedDocs = activeFolder
    ? documents.filter(d => d.folderId === activeFolder)
    : folders.length === 0 ? documents : documents.filter(d => !d.folderId)

  const rootFolders = folders.filter(f => !f.parentId)

  const fileTypeIcon = (ft: string) => {
    const t = ft.toLowerCase()
    if (t === "pdf") return "🔵"
    if (["xlsx", "xls", "csv"].includes(t)) return "🟢"
    if (["docx", "doc"].includes(t)) return "📄"
    return "📎"
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "hsl(var(--bg-subtle))" }}>
          {[
            { key: "files", label: "Files", icon: FolderOpen },
            { key: "activity", label: "Activity", icon: Eye },
            { key: "qa", label: "Q&A", icon: MessageSquare },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? "hsl(var(--surface))" : "transparent",
                color: activeTab === tab.key ? "hsl(var(--text))" : "hsl(var(--text-subtle))",
                boxShadow: activeTab === tab.key ? "var(--shadow-xs)" : "none",
              }}>
              <tab.icon className="h-4 w-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* FILES TAB */}
        {activeTab === "files" && (
          <div className="space-y-5">
            {/* Folder grid — like Image 3 */}
            {rootFolders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="h-4 w-4" style={{ color: "hsl(var(--text-subtle))" }} />
                  <span className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Files</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div
                    onClick={() => setActiveFolder(null)}
                    className={`folder-card ${activeFolder === null ? "active" : ""}`}
                  >
                    <span className="text-2xl">📁</span>
                    <span className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>All Files</span>
                  </div>
                  {rootFolders.map(f => (
                    <div key={f.id} onClick={() => setActiveFolder(f.id)}
                      className={`folder-card ${activeFolder === f.id ? "active" : ""}`}>
                      <span className="text-2xl">{FOLDER_ICONS[f.name.toLowerCase()] ?? "📂"}</span>
                      <span className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>{f.name}</span>
                      <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                        {documents.filter(d => d.folderId === f.id).length} files
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document list — like Image 3 */}
            <div className="card overflow-hidden">
              {displayedDocs.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-10 w-10 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
                  <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>No documents in this folder.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                  {displayedDocs.map(doc => {
                    const filename = doc.filePath.split("/").pop()
                    return (
                      <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <span className="text-lg shrink-0">{fileTypeIcon(doc.fileType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" style={{ color: "hsl(var(--text))" }}>{doc.name}</p>
                          {doc.label !== "NONE" && (
                            <span className="text-xs font-medium" style={{
                              color: doc.label === "CONFIDENTIAL" ? "hsl(var(--danger))" :
                                     doc.label === "FINAL" ? "hsl(var(--success))" : "hsl(var(--warning))"
                            }}>
                              {doc.label === "CONFIDENTIAL" ? "Watermarked PDF" : doc.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--bg-subtle))", color: "hsl(var(--text-subtle))" }}>
                            <Lock className="h-3 w-3" />Encrypted Access
                          </span>
                          <a href={`/api/files/${doc.projectId}/${filename}`} target="_blank"
                            onClick={() => trackOpen(doc.id)}
                            className="btn btn-ghost btn-icon-sm">
                            <Eye className="h-4 w-4" />
                          </a>
                          {doc.allowDownload && (
                            <a href={`/api/files/${doc.projectId}/${filename}?download=1`}
                              onClick={() => trackOpen(doc.id)}
                              className="btn btn-ghost btn-icon-sm">
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === "activity" && (
          <div className="card overflow-hidden">
            <div className="card-header"><h3 className="card-title">Document Activity</h3></div>
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: "hsl(var(--text-muted))" }}>No activity yet.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                {recentActivity.map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{ background: "hsl(var(--navy))", color: "white" }}>
                      {a.investorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.investorName} <span className="font-normal" style={{ color: "hsl(var(--text-subtle))" }}>viewed</span></p>
                      <p className="text-xs truncate" style={{ color: "hsl(var(--text-subtle))" }}>{a.documentName}</p>
                    </div>
                    <p className="text-xs shrink-0" style={{ color: "hsl(var(--text-muted))" }}>
                      {new Date(a.viewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Q&A TAB */}
        {activeTab === "qa" && (
          <div className="space-y-4">
            <div className="card card-p space-y-3">
              <h3 className="font-semibold" style={{ color: "hsl(var(--text))" }}>Ask a Question</h3>
              <textarea value={qaText} onChange={e => setQaText(e.target.value)}
                placeholder="What would you like to know about this project?"
                className="input textarea" rows={3} />
              {qaSuccess && <p className="text-sm" style={{ color: "hsl(var(--success))" }}>✓ Question submitted successfully</p>}
              <button onClick={submitQuestion} disabled={qaLoading || !qaText.trim()} className="btn btn-primary btn-sm">
                {qaLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Submit Question
              </button>
            </div>
            {questions.length > 0 && (
              <div className="space-y-3">
                {questions.map(q => (
                  <div key={q.id} className="card card-p space-y-2">
                    <p className="font-medium text-sm">{q.question}</p>
                    {q.answer && (
                      <div className="rounded-lg p-3" style={{ background: "hsl(var(--success-light))" }}>
                        <p className="text-sm" style={{ color: "hsl(var(--success))" }}>{q.answer}</p>
                      </div>
                    )}
                    {!q.answer && <span className="badge badge-yellow">Awaiting response</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right sidebar — Document Activity (like Image 3) */}
      <div className="hidden lg:block w-64 shrink-0 space-y-4">
        {/* Security indicators */}
        <div className="card card-p space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>Security</h3>
          {[
            { icon: Shield, label: "Encrypted Access", color: "hsl(var(--emerald))" },
            { icon: BookOpen, label: "Watermarked PDFs", color: "hsl(var(--blue))" },
            { icon: Eye, label: "Activity Tracked", color: "hsl(var(--warning))" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.color + "20" }}>
                <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
              </div>
              <span className="text-xs font-medium" style={{ color: "hsl(var(--text-subtle))" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Document Activity sidebar — exactly like Image 3 */}
        {recentActivity.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--text-muted))" }}>Document Activity</h3>
            </div>
            <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
              {recentActivity.slice(0, 6).map(a => (
                <div key={a.id} className="flex items-start gap-2.5 px-4 py-3">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ background: "hsl(var(--navy))", color: "white" }}>
                    {a.investorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-snug" style={{ color: "hsl(var(--text))" }}>
                      {a.investorName.split(" ")[0]} {a.investorName.split(" ")[1]?.[0]}.{" "}
                      <span className="font-normal" style={{ color: "hsl(var(--text-subtle))" }}>viewed</span>
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>{a.documentName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
