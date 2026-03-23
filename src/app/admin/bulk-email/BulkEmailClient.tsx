"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2, Mail, Users } from "lucide-react"

type Campaign = { id: string; name: string; subject: string; status: string; sentCount: number; sentAt: string | null; createdAt: string }

export function BulkEmailClient({ campaigns, projects, investorCount }: { campaigns: Campaign[]; projects: { id: string; name: string }[]; investorCount: number }) {
  const router = useRouter()
  const [name, setName]       = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody]       = useState("")
  const [segment, setSegment] = useState("all")
  const [projectId, setProjectId] = useState("")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)

  async function send() {
    if (!name || !subject || !body) return
    setLoading(true)
    const r = await fetch("/api/admin/bulk-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, body, segment, projectId: projectId || null })
    })
    setLoading(false)
    if (r.ok) { setName(""); setSubject(""); setBody(""); router.refresh() }
  }

  return (
    <div className="space-y-5">
      <div className="card card-p space-y-4">
        <h3 className="card-title">New Campaign</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Campaign name" className="input" />
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" className="input" />
          <select value={segment} onChange={e => setSegment(e.target.value)} className="input select">
            <option value="all">All investors ({investorCount})</option>
            <option value="with_access">With data room access</option>
            <option value="no_access">Without access</option>
            <option value="pending_nda">Pending NDA</option>
          </select>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input select">
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder="Email body... Use {{firstName}}, {{lastName}}, {{projectName}} as variables"
          className="input textarea" rows={6} />
        <div className="flex items-center gap-3">
          <button onClick={send} disabled={loading || !name || !subject || !body} className="btn btn-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Campaign
          </button>
          <p className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>
            Will be sent to all {segment === "all" ? investorCount : "matching"} investors
          </p>
        </div>
      </div>

      {/* Past campaigns */}
      {campaigns.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Recent Campaigns</h3></div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Subject</th><th>Status</th><th>Sent</th><th>Date</th></tr></thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td style={{ color: "hsl(var(--text-subtle))" }}>{c.subject}</td>
                    <td><span className={`badge ${c.status === "SENT" ? "badge-green" : c.status === "SENDING" ? "badge-blue" : "badge-gray"}`}>{c.status}</span></td>
                    <td className="text-sm">{c.sentCount} recipients</td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>
                      {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
