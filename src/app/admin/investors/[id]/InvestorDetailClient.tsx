"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export function InvestorDetailClient({ user, projects }: { user: any; projects: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [grantProject, setGrantProject] = useState("")
  const name = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email

  async function updateStatus(status: string) {
    setLoading(true)
    await fetch(`/api/admin/investors/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    setLoading(false); router.refresh()
  }
  async function grantAccess() {
    if (!grantProject) return
    setLoading(true)
    await fetch("/api/admin/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, projectId: grantProject, action: "grant" }) })
    setLoading(false); setGrantProject(""); router.refresh()
  }
  async function revokeAccess(projectId: string) {
    setLoading(true)
    await fetch("/api/admin/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, projectId, action: "revoke" }) })
    setLoading(false); router.refresh()
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/investors" className="text-xs px-2.5 py-1.5 rounded-lg border" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--text-subtle))" }}>← Back</Link>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>{name}</h1>
        <span className={`badge text-xs badge-${user.status === "APPROVED" ? "approved" : user.status === "REJECTED" ? "rejected" : "pending"}`}>{user.status.replace("_"," ")}</span>
      </div>

      {/* Profile */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "hsl(var(--surface))", borderColor: "hsl(var(--border))" }}>
        <h3 className="text-sm font-medium">Profile</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[["Email", user.email], ["Phone", user.profile?.phone], ["Company", user.profile?.companyName], ["Country", user.profile?.country], ["Investor Type", user.profile?.investorType], ["Est. Ticket", user.profile?.estTicket]].map(([k,v]) => v ? (
            <div key={k}><p className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{k}</p><p style={{ color: "hsl(var(--text))" }}>{v}</p></div>
          ) : null)}
        </div>
      </div>

      {/* Status actions */}
      {user.status !== "APPROVED" && (
        <div className="flex gap-2">
          <button onClick={() => updateStatus("APPROVED")} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "hsl(142 71% 45%)", color: "#fff" }}>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}Approve
          </button>
          {user.status !== "REJECTED" && (
            <button onClick={() => updateStatus("REJECTED")} disabled={loading} className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "hsl(0 72% 40%)", color: "hsl(0 72% 65%)" }}>Reject</button>
          )}
        </div>
      )}

      {/* Project access */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: "hsl(var(--surface))", borderColor: "hsl(var(--border))" }}>
        <h3 className="text-sm font-medium">Project Access</h3>
        {user.accessGrants.length === 0 ? <p className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>No access granted yet.</p> : (
          <div className="space-y-2">
            {user.accessGrants.map((g: any) => (
              <div key={g.id} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "hsl(var(--text))" }}>{g.project.name}</span>
                <button onClick={() => revokeAccess(g.project.id)} className="text-xs" style={{ color: "hsl(0 72% 55%)" }}>Revoke</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <select value={grantProject} onChange={e => setGrantProject(e.target.value)} className="flex-1 rounded-lg px-3 py-2 text-sm" style={{ background: "hsl(var(--surface-raised))", border: "1px solid hsl(var(--border))", color: "hsl(var(--text-subtle))", appearance: "auto" }}>
            <option value="">Grant access to project…</option>
            {projects.filter(p => !user.accessGrants.find((g: any) => g.project.id === p.id)).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={grantAccess} disabled={!grantProject || loading} className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "hsl(var(--text))", color: "hsl(var(--text))", opacity: (!grantProject || loading) ? 0.5 : 1 }}>Grant</button>
        </div>
      </div>

      {/* Activity */}
      {user.documentActivities.length > 0 && (
        <div className="rounded-xl border p-5 space-y-3" style={{ background: "hsl(var(--surface))", borderColor: "hsl(var(--border))" }}>
          <h3 className="text-sm font-medium">Document Activity</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Document</th><th>Project</th><th>Event</th></tr></thead>
              <tbody>
                {user.documentActivities.map((a: any) => (
                  <tr key={a.id}>
                    <td className="text-xs whitespace-nowrap" style={{ color: "hsl(var(--text-subtle))" }}>{new Date(a.viewedAt).toLocaleString()}</td>
                    <td className="text-sm" style={{ color: "hsl(var(--text))" }}>{a.document.name}</td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{a.project.name}</td>
                    <td><span className={`badge text-xs ${a.event === "open" ? "badge-new" : "badge-read"}`}>{a.event}</span></td>
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
