"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Info, FileText, HelpCircle, CheckSquare,
  Bell, Users, Zap, DollarSign, FileSignature,
  Plus, Loader2, Check, X, Trash2, ToggleLeft, ToggleRight
} from "lucide-react"
import { ProjectEditForm } from "../ProjectEditForm"

const TABS = [
  { id: "info",      label: "Informations", icon: Info },
  { id: "docs",      label: "Documents",    icon: FileText },
  { id: "qa",        label: "Q&A",          icon: HelpCircle },
  { id: "checklist", label: "Due Diligence",icon: CheckSquare },
  { id: "updates",   label: "Updates",      icon: Bell },
  { id: "investors", label: "Investisseurs",icon: Users },
  { id: "captable",  label: "Cap Table",    icon: DollarSign },
  { id: "esign",     label: "E-Signatures", icon: FileSignature },
  { id: "workflows", label: "Workflows",    icon: Zap },
]

const TRIGGERS: Record<string, string> = {
  NDA_SIGNED: "NDA signé", NDA_APPROVED: "NDA approuvé",
  INVESTOR_REGISTERED: "Investisseur inscrit", ACCESS_GRANTED: "Accès accordé", KYC_APPROVED: "KYC approuvé"
}
const ACTIONS: Record<string, string> = {
  GRANT_ACCESS: "Accorder accès", SEND_EMAIL: "Envoyer email",
  SET_PIPELINE_STAGE: "Changer stage", CREATE_NOTE: "Ajouter note", NOTIFY_ADMIN: "Notifier admin"
}

export function ProjectUnifiedClient({ project, investors, totalRaised }: { project: any; investors: any[]; totalRaised: number }) {
  const router = useRouter()
  const [tab, setTab] = useState("info")
  const [loading, setLoading] = useState(false)

  // Cap table form
  const [ctForm, setCtForm] = useState({ investorName: "", amount: "", entryType: "EQUITY" })
  // Q&A answer
  const [answers, setAnswers] = useState<Record<string, string>>({})
  // DD checklist
  const [ddName, setDdName] = useState("")
  // Update form
  const [updateTitle, setUpdateTitle] = useState("")
  const [updateContent, setUpdateContent] = useState("")
  // Workflow form
  const [wfForm, setWfForm] = useState({ name: "", trigger: "NDA_SIGNED", action: "GRANT_ACCESS" })

  async function post(url: string, body: any) {
    setLoading(true)
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setLoading(false); router.refresh()
  }
  async function patch(url: string, body: any) {
    setLoading(true)
    await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setLoading(false); router.refresh()
  }
  async function del(url: string) {
    setLoading(true)
    await fetch(url, { method: "DELETE" })
    setLoading(false); router.refresh()
  }

  const pct = project.targetRaise ? Math.min(100, Math.round((totalRaised / project.targetRaise) * 100)) : 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/projects" className="btn btn-secondary btn-sm">
          <ArrowLeft className="h-3.5 w-3.5" />Back
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="page-title">{project.name}</h1>
          <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{project.sector ?? "—"} · {project.country ?? "—"}</p>
        </div>
        <span className={`badge ${project.lifecycle === "LIVE" ? "badge-green" : project.lifecycle === "CLOSED" ? "badge-red" : "badge-yellow"}`}>
          {project.lifecycle}
        </span>
        {project.targetRaise && (
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: "hsl(var(--text))" }}>{pct}%</p>
            <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>financé</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              color: tab === id ? "hsl(var(--emerald))" : "hsl(var(--text-subtle))",
              borderBottom: tab === id ? "2px solid hsl(var(--emerald))" : "2px solid transparent",
              background: "transparent", marginBottom: -1,
            }}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Tab: Info — réutilise ProjectEditForm */}
      {tab === "info" && <ProjectEditForm project={project} />}

      {/* Tab: Documents */}
      {tab === "docs" && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="card-title">Documents ({project.documents.length})</h3>
            <Link href={`/admin/documents?project=${project.id}`} className="btn btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" />Ajouter
            </Link>
          </div>
          {project.documents.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucun document</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Nom</th><th>Type</th><th>Dossier</th><th>Statut</th><th>Label</th></tr></thead>
              <tbody>
                {project.documents.map((d: any) => (
                  <tr key={d.id}>
                    <td className="font-medium text-sm">{d.name}</td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{d.fileType}</td>
                    <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{d.folder?.name ?? "—"}</td>
                    <td><span className={`badge ${d.status === "PUBLISHED" ? "badge-green" : "badge-yellow"}`}>{d.status}</span></td>
                    <td><span className="badge badge-gray">{d.label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Q&A */}
      {tab === "qa" && (
        <div className="space-y-3">
          {project.projectQuestions.length === 0 ? (
            <div className="card p-8 text-center">
              <HelpCircle className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucune question</p>
            </div>
          ) : project.projectQuestions.map((q: any) => (
            <div key={q.id} className="card card-p space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>{q.question}</p>
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                    {q.user?.profile ? `${q.user.profile.firstName} ${q.user.profile.lastName}` : q.user?.email} · {new Date(q.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className={`badge shrink-0 ${q.status === "ANSWERED" ? "badge-green" : "badge-blue"}`}>{q.status}</span>
              </div>
              {q.answer ? (
                <div className="rounded-lg p-3 text-sm" style={{ background: "hsl(var(--emerald-light))", color: "hsl(var(--emerald))" }}>
                  {q.answer}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={answers[q.id] ?? ""} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                    placeholder="Répondre…" className="input flex-1" />
                  <button onClick={() => patch(`/api/admin/questions/${q.id}`, { answer: answers[q.id] })} className="btn btn-primary btn-sm">
                    <Check className="h-3.5 w-3.5" />Répondre
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: DD Checklist */}
      {tab === "checklist" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={ddName} onChange={e => setDdName(e.target.value)}
              placeholder="Nouvel élément checklist…" className="input flex-1" />
            <button onClick={() => { post("/api/admin/checklist", { projectId: project.id, name: ddName }); setDdName("") }}
              disabled={!ddName.trim() || loading} className="btn btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" />Ajouter
            </button>
          </div>
          {project.ddChecklist.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckSquare className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Checklist vide</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="card-header">
                <h3 className="card-title">Checklist</h3>
                <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                  {project.ddChecklist.filter((d: any) => d.documentId).length}/{project.ddChecklist.length} complétés
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                {project.ddChecklist.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`h-4 w-4 rounded shrink-0 flex items-center justify-center`}
                      style={{ background: item.documentId ? "hsl(var(--emerald))" : "hsl(var(--bg-subtle))", border: "1px solid hsl(var(--border))" }}>
                      {item.documentId && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <span className="text-sm flex-1" style={{ color: "hsl(var(--text))" }}>{item.name}</span>
                    {item.required && <span className="badge badge-yellow text-xs">Requis</span>}
                    <button onClick={() => del(`/api/admin/checklist/${item.id}`)} className="btn btn-ghost btn-icon-sm">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Updates */}
      {tab === "updates" && (
        <div className="space-y-4">
          <div className="card card-p space-y-3">
            <h3 className="card-title">Publier un update</h3>
            <input value={updateTitle} onChange={e => setUpdateTitle(e.target.value)} placeholder="Titre…" className="input" />
            <textarea value={updateContent} onChange={e => setUpdateContent(e.target.value)} placeholder="Contenu…" className="input textarea" rows={4} />
            <button onClick={() => { post("/api/admin/updates/" + project.id, { title: updateTitle, content: updateContent }); setUpdateTitle(""); setUpdateContent("") }}
              disabled={!updateTitle || !updateContent || loading} className="btn btn-primary btn-sm">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Publier
            </button>
          </div>
          {project.updates.map((u: any) => (
            <div key={u.id} className="card card-p space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-sm" style={{ color: "hsl(var(--text))" }}>{u.title}</h4>
                <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
              <p className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>{u.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Investisseurs */}
      {tab === "investors" && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="card-title">Investisseurs avec accès ({project.accessGrants.length})</h3>
          </div>
          {project.accessGrants.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucun accès accordé</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Investisseur</th><th>Stage</th><th>Accordé le</th><th>Actions</th></tr></thead>
              <tbody>
                {project.accessGrants.map((g: any) => {
                  const name = g.user?.profile ? `${g.user.profile.firstName} ${g.user.profile.lastName}` : g.user?.email
                  return (
                    <tr key={g.id}>
                      <td>
                        <Link href={`/admin/investors/${g.userId}`} className="font-medium text-sm hover:underline" style={{ color: "hsl(var(--emerald))" }}>
                          {name}
                        </Link>
                      </td>
                      <td><span className="badge badge-blue">{g.pipelineStage}</span></td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{new Date(g.grantedAt).toLocaleDateString("fr-FR")}</td>
                      <td>
                        {!g.revokedAt && (
                          <button onClick={() => post("/api/admin/invitations", { userId: g.userId, projectId: project.id, action: "revoke" })}
                            className="text-xs" style={{ color: "hsl(var(--danger))" }}>Révoquer</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Cap Table */}
      {tab === "captable" && (
        <div className="space-y-4">
          <div className="card card-p space-y-3">
            <h3 className="card-title">Ajouter une entrée</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={ctForm.investorName} onChange={e => setCtForm(p => ({ ...p, investorName: e.target.value }))}
                placeholder="Nom investisseur" className="input" />
              <input value={ctForm.amount} onChange={e => setCtForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="Montant (USD)" type="number" className="input" />
              <select value={ctForm.entryType} onChange={e => setCtForm(p => ({ ...p, entryType: e.target.value }))} className="input select">
                {["EQUITY", "DEBT", "CONVERTIBLE", "SAFE", "OTHER"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={() => {
              post("/api/admin/cap-table", { projectId: project.id, investorName: ctForm.investorName, amount: parseInt(ctForm.amount), entryType: ctForm.entryType })
              setCtForm({ investorName: "", amount: "", entryType: "EQUITY" })
            }} disabled={!ctForm.investorName || !ctForm.amount || loading} className="btn btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" />Ajouter
            </button>
          </div>
          {project.capTable.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <h3 className="card-title">Cap Table</h3>
                <span className="text-sm font-bold" style={{ color: "hsl(var(--emerald))" }}>
                  Total: ${totalRaised.toLocaleString()}
                </span>
              </div>
              <table className="data-table">
                <thead><tr><th>Investisseur</th><th>Montant</th><th>%</th><th>Type</th><th></th></tr></thead>
                <tbody>
                  {project.capTable.map((e: any) => {
                    const pct = totalRaised > 0 ? Math.round((e.amount / totalRaised) * 1000) / 10 : 0
                    return (
                      <tr key={e.id}>
                        <td className="font-medium">{e.investorName}</td>
                        <td>${Number(e.amount).toLocaleString()}</td>
                        <td>{pct}%</td>
                        <td><span className="badge badge-purple">{e.entryType}</span></td>
                        <td>
                          <button onClick={() => del(`/api/admin/cap-table/${e.id}`)} className="btn btn-ghost btn-icon-sm">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: E-Signatures */}
      {tab === "esign" && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="card-title">Signatures électroniques</h3>
          </div>
          {project.eSignRequests.length === 0 ? (
            <div className="p-8 text-center">
              <FileSignature className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Aucune demande de signature</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Investisseur</th><th>Document</th><th>Statut</th><th>Envoyé</th><th>Signé</th></tr></thead>
              <tbody>
                {project.eSignRequests.map((e: any) => {
                  const name = e.recipient?.profile ? `${e.recipient.profile.firstName} ${e.recipient.profile.lastName}` : e.recipient?.email
                  return (
                    <tr key={e.id}>
                      <td className="font-medium">{name}</td>
                      <td className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>{e.document.name}</td>
                      <td><span className={`badge ${e.status === "SIGNED" ? "badge-green" : e.status === "DECLINED" ? "badge-red" : "badge-yellow"}`}>{e.status}</span></td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{new Date(e.createdAt).toLocaleDateString("fr-FR")}</td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{e.signedAt ? new Date(e.signedAt).toLocaleDateString("fr-FR") : "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Workflows */}
      {tab === "workflows" && (
        <div className="space-y-4">
          <div className="card card-p space-y-3">
            <h3 className="card-title">Créer un workflow</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={wfForm.name} onChange={e => setWfForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nom du workflow" className="input" />
              <select value={wfForm.trigger} onChange={e => setWfForm(p => ({ ...p, trigger: e.target.value }))} className="input select">
                {Object.entries(TRIGGERS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select value={wfForm.action} onChange={e => setWfForm(p => ({ ...p, action: e.target.value }))} className="input select">
                {Object.entries(ACTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <button onClick={() => { post("/api/admin/workflows", { ...wfForm, projectId: project.id, active: true }); setWfForm({ name: "", trigger: "NDA_SIGNED", action: "GRANT_ACCESS" }) }}
              disabled={!wfForm.name || loading} className="btn btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" />Créer
            </button>
          </div>
          {project.workflowRules.length > 0 && (
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead><tr><th>Nom</th><th>Trigger</th><th>Action</th><th>Runs</th><th>Statut</th><th></th></tr></thead>
                <tbody>
                  {project.workflowRules.map((w: any) => (
                    <tr key={w.id}>
                      <td className="font-medium">{w.name}</td>
                      <td><span className="badge badge-blue">{TRIGGERS[w.trigger] ?? w.trigger}</span></td>
                      <td><span className="badge badge-emerald">{ACTIONS[w.action] ?? w.action}</span></td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{w.runCount}×</td>
                      <td>
                        <button onClick={() => patch(`/api/admin/workflows/${w.id}`, { active: !w.active })} className="btn btn-ghost btn-icon-sm">
                          {w.active ? <ToggleRight className="h-5 w-5" style={{ color: "hsl(var(--emerald))" }} /> : <ToggleLeft className="h-5 w-5" style={{ color: "hsl(var(--text-muted))" }} />}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => del(`/api/admin/workflows/${w.id}`)} className="btn btn-ghost btn-icon-sm">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
