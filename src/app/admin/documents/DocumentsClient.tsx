"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2, Trash2 } from "lucide-react"
export function DocumentsClient({ projectId, documents }: { projectId: string; documents: any[] }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [msg, setMsg] = useState(""); const [versionOf, setVersionOf] = useState(""); const fileRef = useRef<HTMLInputElement>(null); const nameRef = useRef<HTMLInputElement>(null)
  async function upload() {
    const file = fileRef.current?.files?.[0]; const name = nameRef.current?.value?.trim()
    if (!file || !name) { setMsg("Please enter a name and select a file."); return }
    setLoading(true); setMsg("Uploading…")
    const fd = new FormData(); fd.append("file", file); fd.append("projectId", projectId); fd.append("name", name); fd.append("type", "document"); if (versionOf) fd.append("versionOf", versionOf)
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd }); const d = await r.json(); setLoading(false)
    if (!r.ok) { setMsg(d.error ?? "Upload failed"); return }
    setMsg("✓ Uploaded"); if (fileRef.current) fileRef.current.value = ""; if (nameRef.current) nameRef.current.value = ""; setVersionOf(""); router.refresh()
  }
  async function deleteDoc(id: string) {
    if (!confirm("Delete this document?")) return
    setLoading(true)
    await fetch(`/api/admin/documents/${id}`, { method: "DELETE" })
    setLoading(false); router.refresh()
  }
  return (
    <div className="space-y-5">
      {/* Upload */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}>
        <h3 className="text-sm font-medium">Upload Document</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input ref={nameRef} placeholder="Document name" className="rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 85%)" }}/>
          <input ref={fileRef} type="file" accept=".pdf,.xlsx,.docx,.pptx" className="rounded-lg px-3 py-2 text-sm" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 65%)" }}/>
          <select value={versionOf} onChange={e => setVersionOf(e.target.value)} className="rounded-lg px-3 py-2 text-sm" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 70%)", appearance: "auto" }}>
            <option value="">New document</option>
            {documents.map(d => <option key={d.id} value={d.id}>{d.name} (v{d.version})</option>)}
          </select>
        </div>
        {msg && <p className="text-xs" style={{ color: msg.startsWith("✓") ? "hsl(142 71% 55%)" : "hsl(0 72% 65%)" }}>{msg}</p>}
        <button onClick={upload} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "hsl(0 0% 90%)", color: "hsl(0 0% 5%)" }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4"/>}Upload
        </button>
      </div>
      {/* List */}
      {documents.length === 0 ? <p className="text-sm" style={{ color: "hsl(0 0% 35%)" }}>No documents uploaded yet.</p> : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(0 0% 11%)" }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Version</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
            <tbody>
              {documents.map(d => {
                const kb = d.sizeBytes ? d.sizeBytes < 1048576 ? `${Math.round(d.sizeBytes/1024)} KB` : `${(d.sizeBytes/1048576).toFixed(1)} MB` : "—"
                return (
                  <tr key={d.id}>
                    <td className="text-sm font-medium" style={{ color: "hsl(0 0% 85%)" }}>{d.name}</td>
                    <td><span className="badge badge-read text-xs">v{d.version}</span>{d.versions.length > 0 && <span className="text-xs ml-1" style={{ color: "hsl(0 0% 40%)" }}>({d.versions.length} archived)</span>}</td>
                    <td className="text-xs" style={{ color: "hsl(0 0% 50%)" }}>{kb}</td>
                    <td className="text-xs" style={{ color: "hsl(0 0% 40%)" }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <a href={`/api/files/${d.projectId}/${d.filePath.split("/").pop()}`} target="_blank" className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}>View</a>
                        <button onClick={() => deleteDoc(d.id)} className="text-xs px-2 py-1 rounded-lg" style={{ color: "hsl(0 72% 55%)" }}><Trash2 className="h-3.5 w-3.5"/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
