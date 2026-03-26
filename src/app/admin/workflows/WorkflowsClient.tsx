"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Zap, CheckCircle, XCircle, ToggleLeft, ToggleRight } from "lucide-react"

const TRIGGERS = [
  { value: "NDA_SIGNED",          label: "NDA Signed by investor" },
  { value: "NDA_APPROVED",        label: "NDA Approved by admin" },
  { value: "INVESTOR_REGISTERED", label: "New investor registered" },
  { value: "INVESTOR_APPROVED",   label: "Investor account approved" },
  { value: "DOCUMENT_OPENED",     label: "Document opened" },
  { value: "ACCESS_GRANTED",      label: "Access granted" },
]

const ACTIONS = [
  { value: "GRANT_ACCESS",      label: "Grant data room access" },
  { value: "SEND_EMAIL",        label: "Send email to investor" },
  { value: "SET_PIPELINE_STAGE",label: "Update pipeline stage" },
  { value: "NOTIFY_ADMIN",      label: "Notify admin" },
  { value: "CREATE_NOTE",       label: "Create CRM note" },
]

type Rule = { id: string; name: string; trigger: string; action: string; active: boolean; logs: { id: string; status: string; createdAt: string }[] }
type Project = { id: string; name: string }

export function WorkflowsClient({ rules, projects }: { rules: Rule[]; projects: Project[] }) {
  const router = useRouter()
  const [name, setName]       = useState("")
  const [trigger, setTrigger] = useState("NDA_APPROVED")
  const [action, setAction]   = useState("GRANT_ACCESS")
  const [projectId, setProjectId] = useState("")

  async function create() {
    if (!name.trim()) return
    await fetch("/api/admin/workflows", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, trigger, action, projectId: projectId || null })
    })
    setName(""); router.refresh()
  }

  async function toggle(id: string, active: boolean) {
    await fetch("/api/admin/workflows", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !active })
    })
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm("Delete this workflow?")) return
    await fetch("/api/admin/workflows", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    })
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Create workflow */}
      <div className="card card-p space-y-4">
        <h3 className="card-title">Create Workflow</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Workflow name" className="input sm:col-span-2" />
          <div className="field">
            <label className="label">When (Trigger)</label>
            <select value={trigger} onChange={e => setTrigger(e.target.value)} className="input select">
              {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Then (Action)</label>
            <select value={action} onChange={e => setAction(e.target.value)} className="input select">
              {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Project (optional)</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input select">
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={create} disabled={!name.trim()} className="btn btn-primary btn-sm">
          <Plus className="h-3.5 w-3.5" />Create Workflow
        </button>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <div className="card card-p text-center py-10">
          <Zap className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(var(--text-muted))" }} />
          <p className="font-medium">No workflows yet</p>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--text-subtle))" }}>Create your first automation above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => {
            const triggerLabel = TRIGGERS.find(t => t.value === rule.trigger)?.label ?? rule.trigger
            const actionLabel  = ACTIONS.find(a => a.value === rule.action)?.label ?? rule.action
            const successCount = rule.logs.filter(e => e.status === "success").length
            return (
              <div key={rule.id} className="card card-p">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{rule.name}</p>
                      <span className={`badge ${rule.active ? "badge-green" : "badge-gray"}`}>
                        {rule.active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="badge badge-blue">When: {triggerLabel}</span>
                      <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>→</span>
                      <span className="badge badge-emerald">Then: {actionLabel}</span>
                    </div>
                    {rule.logs.length > 0 && (
                      <p className="text-xs mt-2" style={{ color: "hsl(var(--text-muted))" }}>
                        Last run: {new Date(rule.logs[0].createdAt).toLocaleString()} · {successCount} successful
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggle(rule.id, rule.active)} className="btn btn-ghost btn-icon-sm" title={rule.active ? "Pause" : "Activate"}>
                      {rule.active ? <ToggleRight className="h-5 w-5" style={{ color: "hsl(var(--emerald))" }} /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button onClick={() => remove(rule.id)} className="btn btn-danger btn-icon-sm">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
