"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, User, GitBranch, Shield, FileCheck,
  MessageCircle, Activity, FileText, StickyNote,
  Check, X, Loader2, Plus, Trash2, Send, FileSignature
} from "lucide-react"

const TABS = [
  { id: "profile",    label: "Profil",      icon: User },
  { id: "pipeline",   label: "Pipeline",    icon: GitBranch },
  { id: "kyc",        label: "KYC / AML",   icon: Shield },
  { id: "nda",        label: "NDAs",        icon: FileCheck },
  { id: "esign",      label: "E-Sign",      icon: FileSignature },
  { id: "qa",         label: "Q&A",         icon: MessageCircle },
  { id: "activity",   label: "Activité",    icon: Activity },
  { id: "notes",      label: "Notes CRM",   icon: StickyNote },
  { id: "chat",       label: "Messages",    icon: FileText },
]

const PIPELINE_STAGES = ["LEAD", "NDA_PENDING", "UNDER_REVIEW", "COMMITTED", "CLOSED"]
const STAGE_LABELS: Record<string, string> = {
  LEAD: "Lead", NDA_PENDING: "NDA Pending", UNDER_REVIEW: "Under Review",
  COMMITTED: "Committed", CLOSED: "Closed"
}

export function InvestorDetailClient({ user, projects, chatMessages }: { user: any; projects: any[]; chatMessages: any[] }) {
  const router = useRouter()
  const [tab, setTab] = useState("profile")
  const [loading, setLoading] = useState(false)
  const [grantProject, setGrantProject] = useState("")
  const [newNote, setNewNote] = useState("")
  const [chatText, setChatText] = useState("")
  const [kycNote, setKycNote] = useState<Record<string, string>>({})

  const name = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email
  const stage = user.profile?.pipelineStage ?? "LEAD"
  const kycStatus = user.profile?.kycStatus ?? "NOT_STARTED"

  async function call(url: string, body: any) {
    setLoading(true)
    await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setLoading(false); router.refresh()
  }
  async function post(url: string, body: any) {
    setLoading(true)
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setLoading(false); router.refresh()
  }

  async function grantAccess() {
    if (!grantProject) return
    await post("/api/admin/invitations", { userId: user.id, projectId: grantProject, action: "grant" })
    setGrantProject("")
  }
  async function addNote() {
    if (!newNote.trim()) return
    await post("/api/admin/investors/" + user.id + "/notes", { content: newNote })
    setNewNote("")
  }
  async function sendChat() {
    if (!chatText.trim()) return
    setLoading(true)
    const projectId = user.accessGrants[0]?.project?.id
    if (projectId) await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, content: chatText }) })
    setChatText(""); setLoading(false); router.refresh()
  }

  const statusColor = user.status === "APPROVED" ? "badge-green" : user.status === "REJECTED" ? "badge-red" : "badge-yellow"

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/investors" className="btn btn-secondary btn-sm">
          <ArrowLeft className="h-3.5 w-3.5" />Back
        </Link>
        <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: "hsl(var(--navy))" }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="page-title">{name}</h1>
          <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{user.email}</p>
        </div>
        <span className={`badge ${statusColor}`}>{user.status.replace("_", " ")}</span>
        {user.status !== "APPROVED" && (
          <button onClick={() => call(`/api/admin/investors/${user.id}`, { status: "APPROVED" })} className="btn btn-primary btn-sm">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Approve
          </button>
        )}
        {user.status === "APPROVED" && (
          <button onClick={() => call(`/api/admin/investors/${user.id}`, { status: "REJECTED" })} className="btn btn-danger btn-sm">
            <X className="h-3.5 w-3.5" />Reject
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors rounded-t"
            style={{
              color: tab === id ? "hsl(var(--emerald))" : "hsl(var(--text-subtle))",
              borderBottom: tab === id ? "2px solid hsl(var(--emerald))" : "2px solid transparent",
              background: "transparent",
              marginBottom: -1,
            }}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Tab: Profile */}
      {tab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card card-p space-y-4">
            <h3 className="card-title">Informations personnelles</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                ["Email", user.email],
                ["Téléphone", user.profile?.phone],
                ["Entreprise", user.profile?.companyName],
                ["Pays", user.profile?.country],
                ["Ville", user.profile?.city],
                ["Poste", user.profile?.jobTitle],
                ["Type investisseur", user.profile?.investorType],
                ["Ticket estimé", user.profile?.estTicket],
              ].map(([k, v]) => v ? (
                <div key={k} className="flex justify-between py-1.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                  <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{k}</span>
                  <span className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>{v}</span>
                </div>
              ) : null)}
            </div>
          </div>
          <div className="card card-p space-y-4">
            <h3 className="card-title">Accès projets</h3>
            {user.accessGrants.length === 0 ? (
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucun accès accordé.</p>
            ) : (
              <div className="space-y-2">
                {user.accessGrants.map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    <span className="text-sm">{g.project.name}</span>
                    <button onClick={() => post("/api/admin/invitations", { userId: user.id, projectId: g.project.id, action: "revoke" })}
                      className="text-xs" style={{ color: "hsl(var(--danger))" }}>Révoquer</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <select value={grantProject} onChange={e => setGrantProject(e.target.value)} className="input select flex-1">
                <option value="">Accorder l'accès à…</option>
                {projects.filter(p => !user.accessGrants.find((g: any) => g.project.id === p.id))
                  .map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={grantAccess} disabled={!grantProject || loading} className="btn btn-primary btn-sm">
                <Plus className="h-3.5 w-3.5" />Accorder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Pipeline */}
      {tab === "pipeline" && (
        <div className="card card-p space-y-5">
          <h3 className="card-title">Progression dans le pipeline</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {PIPELINE_STAGES.map((s, i) => {
              const current = PIPELINE_STAGES.indexOf(stage)
              const isActive = s === stage
              const isPast = i < current
              return (
                <button key={s} onClick={() => call(`/api/admin/investors/${user.id}`, { pipelineStage: s })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: isActive ? "hsl(var(--emerald))" : isPast ? "hsl(var(--emerald-light))" : "hsl(var(--bg-subtle))",
                    color: isActive ? "white" : isPast ? "hsl(var(--emerald))" : "hsl(var(--text-muted))",
                    border: `1px solid ${isActive ? "hsl(var(--emerald))" : isPast ? "hsl(var(--emerald))" : "hsl(var(--border))"}`,
                  }}>
                  {isPast && <Check className="h-3.5 w-3.5" />}
                  {STAGE_LABELS[s]}
                </button>
              )
            })}
          </div>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="card card-p text-center">
              <p className="text-2xl font-bold" style={{ color: "hsl(var(--navy))" }}>{user.ndaRequests.length}</p>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>NDAs soumis</p>
            </div>
            <div className="card card-p text-center">
              <p className="text-2xl font-bold" style={{ color: "hsl(var(--emerald))" }}>{user.accessGrants.length}</p>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Projets accessibles</p>
            </div>
            <div className="card card-p text-center">
              <p className="text-2xl font-bold" style={{ color: "hsl(var(--blue))" }}>{user.documentActivities.length}</p>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Documents vus</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: KYC */}
      {tab === "kyc" && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="card-title">KYC / AML</h3>
            <span className={`badge ${kycStatus === "APPROVED" ? "badge-green" : kycStatus === "REJECTED" ? "badge-red" : kycStatus === "PENDING" ? "badge-yellow" : "badge-gray"}`}>
              {kycStatus.replace("_", " ")}
            </span>
          </div>
          {user.kycDocuments.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucun document KYC soumis</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Type</th><th>Fichier</th><th>Statut</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {user.kycDocuments.map((d: any) => (
                  <tr key={d.id}>
                    <td className="font-medium">{d.docType}</td>
                    <td><a href={`/api/files/${d.filePath}`} target="_blank" className="text-xs" style={{ color: "hsl(var(--emerald))" }}>{d.fileName}</a></td>
                    <td><span className={`badge ${d.status === "APPROVED" ? "badge-green" : d.status === "REJECTED" ? "badge-red" : "badge-yellow"}`}>{d.status}</span></td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{new Date(d.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td>
                      {d.status === "PENDING" && (
                        <div className="flex gap-2">
                          <input value={kycNote[d.id] ?? ""} onChange={e => setKycNote(p => ({ ...p, [d.id]: e.target.value }))}
                            placeholder="Note..." className="input" style={{ width: 120, height: "1.75rem", fontSize: "0.75rem" }} />
                          <button onClick={async () => {
                            await fetch(`/api/admin/kyc/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "APPROVED", adminNote: kycNote[d.id] }) })
                            router.refresh()
                          }} className="btn btn-primary btn-sm"><Check className="h-3 w-3" /></button>
                          <button onClick={async () => {
                            await fetch(`/api/admin/kyc/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "REJECTED", adminNote: kycNote[d.id] }) })
                            router.refresh()
                          }} className="btn btn-danger btn-sm"><X className="h-3 w-3" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: NDA */}
      {tab === "nda" && (
        <div className="card overflow-hidden">
          <div className="card-header"><h3 className="card-title">Demandes NDA</h3></div>
          {user.ndaRequests.length === 0 ? (
            <div className="p-8 text-center">
              <FileCheck className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucun NDA soumis</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Projet</th><th>Statut</th><th>Signé par</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {user.ndaRequests.map((n: any) => (
                  <tr key={n.id}>
                    <td className="font-medium">{n.project.name}</td>
                    <td><span className={`badge ${n.status === "APPROVED" ? "badge-green" : n.status === "REJECTED" ? "badge-red" : "badge-yellow"}`}>{n.status}</span></td>
                    <td className="text-sm">{n.signerFullName ?? "—"}</td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{new Date(n.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td>
                      {n.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button onClick={() => post(`/api/admin/nda/${n.id}`, { action: "approve" })} className="btn btn-primary btn-sm">
                            <Check className="h-3 w-3" />Approuver
                          </button>
                          <button onClick={() => post(`/api/admin/nda/${n.id}`, { action: "reject" })} className="btn btn-danger btn-sm">
                            <X className="h-3 w-3" />Rejeter
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: E-Sign */}
      {tab === "esign" && (
        <div className="card overflow-hidden">
          <div className="card-header"><h3 className="card-title">Demandes de signature</h3></div>
          {user.eSignRequests.length === 0 ? (
            <div className="p-8 text-center">
              <FileSignature className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucune demande de signature</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Document</th><th>Projet</th><th>Statut</th><th>Date</th></tr></thead>
              <tbody>
                {user.eSignRequests.map((e: any) => (
                  <tr key={e.id}>
                    <td className="font-medium">{e.document.name}</td>
                    <td className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>{e.project.name}</td>
                    <td><span className={`badge ${e.status === "SIGNED" ? "badge-green" : e.status === "DECLINED" ? "badge-red" : "badge-yellow"}`}>{e.status}</span></td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{new Date(e.createdAt).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Q&A */}
      {tab === "qa" && (
        <div className="card overflow-hidden">
          <div className="card-header"><h3 className="card-title">Questions & Réponses</h3></div>
          {user.projectQuestions.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucune question posée</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
              {user.projectQuestions.map((q: any) => (
                <div key={q.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>{q.question}</p>
                    <span className={`badge shrink-0 ${q.status === "ANSWERED" ? "badge-green" : q.status === "OPEN" ? "badge-blue" : "badge-gray"}`}>{q.status}</span>
                  </div>
                  <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{q.project.name} · {new Date(q.createdAt).toLocaleDateString("fr-FR")}</p>
                  {q.answer && (
                    <div className="rounded-lg p-3 text-sm" style={{ background: "hsl(var(--emerald-light))", color: "hsl(var(--emerald))" }}>
                      {q.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Activity */}
      {tab === "activity" && (
        <div className="card overflow-hidden">
          <div className="card-header"><h3 className="card-title">Activité documents</h3></div>
          {user.documentActivities.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucune activité</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Heure</th><th>Document</th><th>Projet</th><th>Événement</th></tr></thead>
              <tbody>
                {user.documentActivities.map((a: any) => (
                  <tr key={a.id}>
                    <td className="text-xs whitespace-nowrap" style={{ color: "hsl(var(--text-muted))" }}>{new Date(a.viewedAt).toLocaleString("fr-FR")}</td>
                    <td className="text-sm">{a.document.name}</td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{a.project.name}</td>
                    <td><span className={`badge ${a.event === "open" ? "badge-blue" : "badge-gray"}`}>{a.event}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Notes CRM */}
      {tab === "notes" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={newNote} onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addNote()}
              placeholder="Ajouter une note…" className="input flex-1" />
            <button onClick={addNote} disabled={!newNote.trim() || loading} className="btn btn-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Ajouter
            </button>
          </div>
          {user.investorNotes.length === 0 ? (
            <div className="card p-8 text-center">
              <StickyNote className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucune note</p>
            </div>
          ) : (
            <div className="space-y-2">
              {user.investorNotes.map((n: any) => (
                <div key={n.id} className="card card-p flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm" style={{ color: "hsl(var(--text))" }}>{n.content}</p>
                    <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                      {new Date(n.createdAt).toLocaleDateString("fr-FR")} {n.createdBy ? `· ${n.createdBy}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Chat */}
      {tab === "chat" && (
        <div className="card flex flex-col" style={{ minHeight: 400 }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
                <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucun message</p>
              </div>
            ) : chatMessages.map((m: any) => (
              <div key={m.id} className={`flex ${m.isAdmin ? "justify-end" : "justify-start"}`}>
                <div className="max-w-xs px-3 py-2 rounded-xl text-sm"
                  style={{
                    background: m.isAdmin ? "hsl(var(--navy))" : "hsl(var(--bg-subtle))",
                    color: m.isAdmin ? "white" : "hsl(var(--text))",
                  }}>
                  <p>{m.content}</p>
                  <p className="text-xs mt-1 opacity-60">{m.project?.name} · {new Date(m.createdAt).toLocaleTimeString("fr-FR")}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 flex gap-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            <input value={chatText} onChange={e => setChatText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
              placeholder="Envoyer un message…" className="input flex-1" />
            <button onClick={sendChat} disabled={loading || !chatText.trim()} className="btn btn-navy btn-icon">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
