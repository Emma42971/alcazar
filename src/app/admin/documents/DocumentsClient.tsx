"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2, Trash2, Eye, Download } from "lucide-react"

export function DocumentsClient({ projectId, documents }: { projectId: string; documents: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const [versionOf, setVersionOf] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  async function upload() {
    const file = fileRef.current?.files?.[0]
    const name = nameRef.current?.value?.trim()
    if (!file || !name) { setMsg("Please enter a name and select a file."); return }
    setLoading(true)
    setMsg("Uploading…")
    const fd = new FormData()
    fd.append("file", file)
    fd.append("projectId", projectId)
    fd.append("name", name)
    fd.append("type", "document")
    if (versionOf) fd.append("versionOf", versionOf)
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { setMsg(d.error ?? "Upload failed"); return }
    setMsg("✓ Uploaded successfully")
    if (fileRef.current) fileRef.current.value = ""
    if (nameRef.current) nameRef.current.value = ""
    setVersionOf("")
    router.refresh()
  }

  async function deleteDoc(id: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return
    setLoading(true)
    await fetch(`/api/admin/documents/${id}`, { method: "DELETE" })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Upload card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Upload Document</h3>
        </div>
        <div className="card-p space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input ref={nameRef} placeholder="Document name" className="input" />
            <input ref={fileRef} type="file" accept=".pdf,.xlsx,.docx,.pptx,.xls,.doc" className="input" style={{ cursor: "pointer" }} />
            <select value={versionOf} onChange={e => setVersionOf(e.target.value)} className="input select">
              <option value="">New document</option>
              {documents.map(d => <option key={d.id} value={d.id}>{d.name} (v{d.version})</option>)}
            </select>
          </div>
          {msg && (
            <p className="text-sm" style={{ color: msg.startsWith("✓") ? "hsl(var(--success))" : "hsl(var(--danger))" }}>{msg}</p>
          )}
          <button onClick={upload} disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Document
          </button>
        </div>
      </div>

      {/* Documents list */}
      {documents.length === 0 ? (
        <div className="card card-p text-center py-10">
          <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Version</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {documents.map(d => {
                  const kb = d.sizeBytes
                    ? d.sizeBytes < 1048576 ? `${Math.round(d.sizeBytes / 1024)} KB`
                    : `${(d.sizeBytes / 1048576).toFixed(1)} MB`
                    : "—"
                  const filename = d.filePath.split("/").pop()
                  return (
                    <tr key={d.id}>
                      <td className="font-medium">{d.name}</td>
                      <td>
                        <span className="badge badge-gray">v{d.version}</span>
                        {d.versions?.length > 0 && (
                          <span className="text-xs ml-1.5" style={{ color: "hsl(var(--text-muted))" }}>
                            ({d.versions.length} archived)
                          </span>
                        )}
                      </td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{kb}</td>
                      <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <a href={`/api/files/${d.projectId}/${filename}`} target="_blank" className="btn btn-secondary btn-sm">
                            <Eye className="h-3.5 w-3.5" />View
                          </a>
                          <a href={`/api/files/${d.projectId}/${filename}?download=1`} className="btn btn-secondary btn-sm btn-icon">
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          <button onClick={() => deleteDoc(d.id)} className="btn btn-danger btn-sm btn-icon">
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
