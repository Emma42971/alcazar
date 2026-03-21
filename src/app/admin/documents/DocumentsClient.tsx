"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2, Trash2, Eye, FolderPlus, Folder, ChevronRight, Tag, FileText, AlertCircle } from "lucide-react"

const LABELS = [
  { value: "NONE",        label: "No label",    color: "" },
  { value: "CONFIDENTIAL", label: "Confidential", color: "badge-red" },
  { value: "DRAFT",       label: "Draft",        color: "badge-yellow" },
  { value: "FINAL",       label: "Final",        color: "badge-green" },
  { value: "REVIEWED",    label: "Reviewed",     color: "badge-blue" },
]

type Folder = { id: string; name: string; index: string; parentId: string | null; sortOrder: number }
type Doc    = { id: string; name: string; fileType: string; filePath: string; sizeBytes: number | null; version: number; versions: any[]; createdAt: string; label: string; status: string; internalNote: string | null; folderId: string | null; projectId: string }

export function DocumentsClient({ projectId, documents, folders }: { projectId: string; documents: Doc[]; folders: Folder[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState("")
  const [versionOf, setVersionOf] = useState("")
  const [folderId, setFolderId]   = useState("")
  const [label, setLabel]         = useState("NONE")
  const [status, setStatus]       = useState("PUBLISHED")
  const [note, setNote]           = useState("")
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderParent, setNewFolderParent] = useState("")
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  async function upload() {
    const file = fileRef.current?.files?.[0]
    const name = nameRef.current?.value?.trim()
    if (!file || !name) { setMsg("Please enter a name and select a file."); return }
    setLoading(true); setMsg("Uploading…")
    const fd = new FormData()
    fd.append("file", file); fd.append("projectId", projectId); fd.append("name", name)
    fd.append("type", "document"); fd.append("label", label); fd.append("status", status)
    if (folderId) fd.append("folderId", folderId)
    if (note) fd.append("note", note)
    if (versionOf) fd.append("versionOf", versionOf)
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { setMsg(d.error ?? "Upload failed"); return }
    setMsg("✓ Uploaded successfully")
    if (fileRef.current) fileRef.current.value = ""
    if (nameRef.current) nameRef.current.value = ""
    setNote(""); setVersionOf(""); router.refresh()
  }

  async function createFolder() {
    if (!newFolderName.trim()) return
    await fetch("/api/admin/folders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, name: newFolderName, parentId: newFolderParent || null })
    })
    setNewFolderName(""); router.refresh()
  }

  async function deleteDoc(id: string) {
    if (!confirm("Delete this document?")) return
    await fetch(`/api/admin/documents/${id}`, { method: "DELETE" })
    router.refresh()
  }

  async function deleteFolder(id: string) {
    if (!confirm("Delete this folder and all its documents?")) return
    await fetch(`/api/admin/folders/${id}`, { method: "DELETE" })
    router.refresh()
  }

  async function toggleStatus(doc: Doc) {
    const newStatus = doc.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
    await fetch(`/api/admin/documents/${doc.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    })
    router.refresh()
  }

  const labelMeta = (l: string) => LABELS.find(x => x.value === l) ?? LABELS[0]

  // Build folder tree display
  const rootFolders = folders.filter(f => !f.parentId)
  const childFolders = (parentId: string) => folders.filter(f => f.parentId === parentId)
  const folderDocs = (fId: string | null) => documents.filter(d => (fId ? d.folderId === fId : !d.folderId) && (activeFolder === null || fId === activeFolder || !fId))

  const filteredDocs = activeFolder === null ? documents : documents.filter(d => d.folderId === activeFolder || (!d.folderId && activeFolder === "__root__"))

  return (
    <div className="space-y-5">
      {/* Upload card */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">Upload Document</h3></div>
        <div className="card-p space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input ref={nameRef} placeholder="Document name" className="input" />
            <input ref={fileRef} type="file" accept=".pdf,.xlsx,.docx,.pptx,.xls,.doc,.csv,.txt,.zip,.png,.jpg" className="input" style={{ cursor: "pointer" }} />
            <select value={folderId} onChange={e => setFolderId(e.target.value)} className="input select">
              <option value="">Root (no folder)</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.index} — {f.name}</option>)}
            </select>
            <select value={label} onChange={e => setLabel(e.target.value)} className="input select">
              {LABELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input select">
              <option value="PUBLISHED">Published (visible to investors)</option>
              <option value="DRAFT">Draft (admin only)</option>
            </select>
            <select value={versionOf} onChange={e => setVersionOf(e.target.value)} className="input select">
              <option value="">New document</option>
              {documents.map(d => <option key={d.id} value={d.id}>{d.name} (v{d.version})</option>)}
            </select>
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Internal note (admin only, optional)" className="input" />
          {msg && <p className="text-sm" style={{ color: msg.startsWith("✓") ? "hsl(var(--success))" : "hsl(var(--danger))" }}>{msg}</p>}
          <button onClick={upload} disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Document
          </button>
        </div>
      </div>

      {/* New folder */}
      <div className="card card-p">
        <div className="flex items-center gap-3 flex-wrap">
          <FolderPlus className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--text-subtle))" }} />
          <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="New folder name" className="input" style={{ maxWidth: 220 }} />
          <select value={newFolderParent} onChange={e => setNewFolderParent(e.target.value)} className="input select" style={{ maxWidth: 200 }}>
            <option value="">Root folder</option>
            {rootFolders.map(f => <option key={f.id} value={f.id}>{f.index} — {f.name}</option>)}
          </select>
          <button onClick={createFolder} disabled={!newFolderName.trim()} className="btn btn-secondary">Create Folder</button>
        </div>
      </div>

      {/* Document index */}
      {documents.length === 0 && folders.length === 0 ? (
        <div className="card card-p text-center py-10">
          <FileText className="h-10 w-10 mx-auto mb-2" style={{ color: "hsl(var(--text-muted))" }} />
          <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="card">
          {/* Folder filter tabs */}
          {folders.length > 0 && (
            <div className="card-header gap-2 flex-wrap">
              <button onClick={() => setActiveFolder(null)} className={`btn btn-sm ${activeFolder === null ? "btn-primary" : "btn-ghost"}`}>All</button>
              <button onClick={() => setActiveFolder("__root__")} className={`btn btn-sm ${activeFolder === "__root__" ? "btn-primary" : "btn-ghost"}`}>Root</button>
              {rootFolders.map(f => (
                <button key={f.id} onClick={() => setActiveFolder(f.id)} className={`btn btn-sm ${activeFolder === f.id ? "btn-primary" : "btn-ghost"}`}>
                  <Folder className="h-3.5 w-3.5" />{f.index} {f.name}
                </button>
              ))}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Index</th><th>Name</th><th>Label</th><th>Status</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr></thead>
              <tbody>
                {/* Folders */}
                {(activeFolder === null || activeFolder === "__root__") && folders.filter(f => !f.parentId).map(f => (
                  <tr key={`folder-${f.id}`} style={{ background: "hsl(var(--bg))" }}>
                    <td className="text-xs font-mono" style={{ color: "hsl(var(--text-muted))" }}>{f.index}</td>
                    <td colSpan={4}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--warning))" }} />
                        <span className="font-medium">{f.name}</span>
                        <span className="text-xs ml-1" style={{ color: "hsl(var(--text-muted))" }}>({documents.filter(d => d.folderId === f.id).length} docs)</span>
                      </div>
                    </td>
                    <td></td>
                    <td>
                      <button onClick={() => deleteFolder(f.id)} className="btn btn-danger btn-icon-sm">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Documents */}
                {(activeFolder === null ? documents : documents.filter(d =>
                  activeFolder === "__root__" ? !d.folderId : d.folderId === activeFolder
                )).map(d => {
                  const kb = d.sizeBytes ? d.sizeBytes < 1048576 ? `${Math.round(d.sizeBytes / 1024)} KB` : `${(d.sizeBytes / 1048576).toFixed(1)} MB` : "—"
                  const folder = folders.find(f => f.id === d.folderId)
                  const lMeta = labelMeta(d.label)
                  const filename = d.filePath.split("/").pop()
                  return (
                    <tr key={d.id}>
                      <td className="text-xs font-mono" style={{ color: "hsl(var(--text-muted))" }}>
                        {folder ? `${folder.index}.` : ""}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">{d.name}</p>
                          {d.internalNote && <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>📝 {d.internalNote}</p>}
                        </div>
                      </td>
                      <td>
                        {d.label !== "NONE" && <span className={`badge ${lMeta.color}`}>{lMeta.label}</span>}
                      </td>
                      <td>
                        <button onClick={() => toggleStatus(d)} className={`badge cursor-pointer ${d.status === "PUBLISHED" ? "badge-green" : "badge-yellow"}`}>
                          {d.status === "PUBLISHED" ? "Published" : "Draft"}
                        </button>
                      </td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{kb}</td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>
                        {new Date(d.createdAt).toLocaleDateString()}
                        {d.version > 1 && <span className="ml-1 badge badge-gray">v{d.version}</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <a href={`/api/files/${d.projectId}/${filename}`} target="_blank" className="btn btn-secondary btn-sm">
                            <Eye className="h-3.5 w-3.5" />View
                          </a>
                          <button onClick={() => deleteDoc(d.id)} className="btn btn-danger btn-icon-sm">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
