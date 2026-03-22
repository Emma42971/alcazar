"use client"
import { useState } from "react"
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

type Status = "idle" | "pulling" | "building" | "done" | "error"

export function UpdatesClient() {
  const [status, setStatus] = useState<Status>("idle")
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  async function runUpdate() {
    setStatus("pulling")
    setLogs([])
    setError(null)

    try {
      const r = await fetch("/api/admin/update", { method: "POST" })
      const d = await r.json()

      if (!r.ok) {
        setError(d.error ?? "Update failed")
        setStatus("error")
        return
      }

      if (d.logs) setLogs(d.logs)
      setStatus("done")
    } catch (e: any) {
      setError(e.message)
      setStatus("error")
    }
  }

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className="rounded-xl border p-6 space-y-4" style={{ background: "hsl(var(--surface))", borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--accent))" }}>
            {status === "idle"    && <RefreshCw className="h-5 w-5" style={{ color: "hsl(var(--text-muted))" }} />}
            {(status === "pulling" || status === "building") && <Loader2 className="h-5 w-5 animate-spin" style={{ color: "hsl(var(--text))" }} />}
            {status === "done"    && <CheckCircle className="h-5 w-5" style={{ color: "hsl(142 71% 55%)" }} />}
            {status === "error"   && <AlertCircle className="h-5 w-5" style={{ color: "hsl(0 72% 65%)" }} />}
          </div>
          <div>
            <p className="text-sm font-medium">
              {status === "idle"     && "Ready to update"}
              {status === "pulling"  && "Pulling from GitHub…"}
              {status === "building" && "Rebuilding containers…"}
              {status === "done"     && "Update complete!"}
              {status === "error"    && "Update failed"}
            </p>
            <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
              {status === "idle" && "This will git pull and rebuild the Docker image."}
              {status === "done" && "The application has been updated and restarted."}
              {status === "error" && error}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <p className="text-xs mb-3" style={{ color: "hsl(var(--text-muted))" }}>
            <strong>Before updating:</strong> make sure your latest code is pushed to GitHub. The server will pull from the main branch.
          </p>
          <button
            onClick={runUpdate}
            disabled={status === "pulling" || status === "building"}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity"
            style={{
              background: "hsl(var(--emerald))", color: "white",
              opacity: (status === "pulling" || status === "building") ? 0.6 : 1
            }}
          >
            {(status === "pulling" || status === "building")
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>
              : <><RefreshCw className="h-4 w-4" /> Pull & Rebuild</>
            }
          </button>
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="px-4 py-2 border-b text-xs font-medium" style={{ background: "hsl(var(--accent))", borderColor: "hsl(var(--border))", color: "hsl(var(--text-muted))" }}>
            Build logs
          </div>
          <div className="p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto" style={{ background: "hsl(var(--surface))", color: "hsl(142 71% 55%)" }}>
            {logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}
