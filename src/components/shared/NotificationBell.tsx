"use client"
import { useState, useEffect, useRef } from "react"
import { Bell, X, Check, CheckCheck } from "lucide-react"
import Link from "next/link"

type Notif = {
  id: string; type: string; title: string; body: string
  link: string | null; readAt: string | null; createdAt: string
}

export function NotificationBell() {
  const [notifs, setNotifs]   = useState<Notif[]>([])
  const [open, setOpen]       = useState(false)
  const [connected, setConn]  = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    fetchNotifs()

    // Connect SSE
    const es = new EventSource("/api/events")
    esRef.current = es
    es.onopen = () => setConn(true)
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === "notification") {
          setNotifs(prev => [msg.data, ...prev])
        }
      } catch {}
    }
    es.onerror = () => setConn(false)
    return () => { es.close(); esRef.current = null }
  }, [])

  async function fetchNotifs() {
    const r = await fetch("/api/notifications")
    if (r.ok) setNotifs(await r.json())
  }

  async function markRead(id?: string) {
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true })
    })
    if (id) {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    } else {
      setNotifs(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })))
    }
  }

  const unread = notifs.filter(n => !n.readAt).length

  const ICONS: Record<string, string> = {
    NDA_SUBMITTED: "📝", NDA_APPROVED: "✅", NDA_REJECTED: "❌",
    ACCESS_GRANTED: "🔓", NEW_DOCUMENT: "📄", QA_ANSWERED: "💬",
    NEW_MESSAGE: "✉️", KYC_APPROVED: "✅", ESIGN_REQUESTED: "✍️",
    ESIGN_COMPLETED: "✅", WORKFLOW_FIRED: "⚡",
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="btn btn-ghost btn-icon relative">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-white flex items-center justify-center"
            style={{ background: "hsl(var(--danger))", fontSize: "0.625rem", fontWeight: 700 }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 z-30 card shadow-lg overflow-hidden">
            <div className="card-header py-2">
              <span className="text-sm font-semibold">Notifications</span>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={() => markRead()} className="btn btn-ghost btn-sm">
                    <CheckCheck className="h-3.5 w-3.5" />All read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="btn btn-ghost btn-icon-sm">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: "hsl(var(--border))" }}>
              {notifs.length === 0 ? (
                <div className="p-6 text-center text-sm" style={{ color: "hsl(var(--text-muted))" }}>
                  No notifications yet
                </div>
              ) : (
                notifs.map(n => (
                  <div key={n.id}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50"
                    style={{ background: n.readAt ? "transparent" : "hsl(var(--accent-light, var(--emerald-light)))" }}
                    onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link }}>
                    <span className="text-base shrink-0 mt-0.5">{ICONS[n.type] ?? "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--text))" }}>{n.title}</p>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "hsl(var(--text-subtle))" }}>{n.body}</p>
                      <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                        {new Date(n.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!n.readAt && <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ background: "hsl(var(--emerald))" }} />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
