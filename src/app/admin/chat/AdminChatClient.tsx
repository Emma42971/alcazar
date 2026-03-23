"use client"
import { useState, useEffect, useRef } from "react"
import { Send, Loader2, MessageCircle } from "lucide-react"

type Msg = { id: string; content: string; isAdmin: boolean; senderName: string; createdAt: string }
type Inv = { id: string; name: string; email: string }

export function AdminChatClient({ investors, projects }: { investors: Inv[]; projects: { id: string; name: string }[] }) {
  const [selectedInv, setSelectedInv] = useState<string>(investors[0]?.id ?? "")
  const [selectedProject, setSelectedProject] = useState<string>(projects[0]?.id ?? "")
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedProject) return
    fetch(`/api/chat?projectId=${selectedProject}&userId=${selectedInv}`)
      .then(r => r.json()).then(setMessages)
  }, [selectedInv, selectedProject])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function send() {
    if (!text.trim() || !selectedProject) return
    setLoading(true)
    const r = await fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProject, content: text })
    })
    const msg = await r.json()
    setMessages(p => [...p, msg]); setText(""); setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
      {/* Investor list */}
      <div className="card overflow-hidden">
        <div className="card-header py-2"><h3 className="card-title text-sm">Investors</h3></div>
        <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
          {investors.map(inv => (
            <button key={inv.id} onClick={() => setSelectedInv(inv.id)}
              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              style={{ background: selectedInv === inv.id ? "hsl(var(--emerald-light))" : "transparent" }}>
              <p className="text-xs font-semibold truncate" style={{ color: "hsl(var(--text))" }}>{inv.name}</p>
              <p className="text-xs truncate" style={{ color: "hsl(var(--text-muted))" }}>{inv.email}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="lg:col-span-3 card flex flex-col" style={{ minHeight: 400 }}>
        <div className="card-header py-2 gap-3">
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="input select" style={{ width: "auto" }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>No messages yet</p>
            </div>
          ) : messages.map(m => (
            <div key={m.id} className={`flex ${m.isAdmin ? "justify-end" : "justify-start"}`}>
              <div className="max-w-xs lg:max-w-md px-3 py-2 rounded-xl text-sm"
                style={{
                  background: m.isAdmin ? "hsl(var(--navy))" : "hsl(var(--bg-subtle))",
                  color: m.isAdmin ? "white" : "hsl(var(--text))",
                }}>
                <p>{m.content}</p>
                <p className="text-xs mt-1 opacity-60">{new Date(m.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 flex gap-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message..." className="input flex-1" />
          <button onClick={send} disabled={loading || !text.trim()} className="btn btn-navy btn-icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
