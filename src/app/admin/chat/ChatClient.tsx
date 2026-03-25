"use client"
import { useState, useEffect, useRef } from "react"
import { Send, Loader2, MessageSquare } from "lucide-react"

type Investor = { id: string; name: string; company: string | null; email: string; projects: { id: string; name: string }[] }
type Message  = { id: string; content: string; senderId: string; senderName: string; readAt: string | null; createdAt: string }

export function ChatClient({ investors, isAdmin, currentUserId }: { investors: Investor[]; isAdmin: boolean; currentUserId?: string }) {
  const [selected, setSelected] = useState<Investor | null>(null)
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState("")
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef   = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!selected || !selectedProject) return
    loadMessages()
    pollRef.current = setInterval(loadMessages, 3000)
    return () => clearInterval(pollRef.current)
  }, [selected, selectedProject])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function loadMessages() {
    if (!selected || !selectedProject) return
    const r = await fetch(`/api/chat?projectId=${selectedProject}&withUserId=${selected.id}`)
    if (r.ok) setMessages(await r.json())
  }

  async function send() {
    if (!input.trim() || !selected || !selectedProject) return
    setLoading(true)
    await fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProject, receiverId: selected.id, content: input })
    })
    setInput("")
    setLoading(false)
    loadMessages()
  }

  return (
    <div className="card overflow-hidden flex" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-r overflow-y-auto" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="p-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--text-muted))" }}>Investors</p>
        </div>
        {investors.length === 0 ? (
          <div className="p-4 text-sm text-center" style={{ color: "hsl(var(--text-muted))" }}>No approved investors</div>
        ) : (
          investors.map(inv => (
            <button key={inv.id} onClick={() => { setSelected(inv); setSelectedProject(inv.projects[0]?.id ?? ""); setMessages([]) }}
              className="w-full text-left px-4 py-3 transition-colors hover:bg-gray-50"
              style={{ background: selected?.id === inv.id ? "hsl(var(--emerald-light))" : "transparent" }}>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "hsl(var(--navy))" }}>{inv.name.charAt(0)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--text))" }}>{inv.name}</p>
                  {inv.company && <p className="text-xs truncate" style={{ color: "hsl(var(--text-subtle))" }}>{inv.company}</p>}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Chat area */}
      {!selected ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3" style={{ color: "hsl(var(--text-muted))" }} />
            <p className="font-medium" style={{ color: "hsl(var(--text))" }}>Select an investor to start messaging</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "hsl(var(--border))" }}>
            <div>
              <p className="font-semibold text-sm">{selected.name}</p>
              <p className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{selected.email}</p>
            </div>
            {selected.projects.length > 1 && (
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="input select" style={{ width: "auto" }}>
                {selected.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(m => {
              const isMe = isAdmin ? m.senderId !== selected.id : m.senderId === selected.id
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-xs lg:max-w-md">
                    <div className="px-4 py-2.5 rounded-2xl text-sm"
                      style={{
                        background: isMe ? "hsl(var(--navy))" : "hsl(var(--bg-subtle))",
                        color: isMe ? "white" : "hsl(var(--text))",
                        borderBottomRightRadius: isMe ? "4px" : "16px",
                        borderBottomLeftRadius: isMe ? "16px" : "4px",
                      }}>
                      {m.content}
                    </div>
                    <p className="text-xs mt-1 px-1" style={{ color: "hsl(var(--text-muted))", textAlign: isMe ? "right" : "left" }}>
                      {new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t flex gap-3" style={{ borderColor: "hsl(var(--border))" }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Type a message..." className="input flex-1" />
            <button onClick={send} disabled={loading || !input.trim()} className="btn btn-primary btn-icon">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
