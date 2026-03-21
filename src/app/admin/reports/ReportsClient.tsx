"use client"

type DocRow   = { docId: string; views: number; totalSec: number }
type Investor = { userId: string; name: string; company: string; score: number; docScores: DocRow[]; grantedAt: string }
type Doc      = { id: string; name: string }

function heatColor(views: number): string {
  if (views === 0) return "hsl(var(--bg-subtle))"
  if (views >= 5)  return "hsl(152 57% 88%)"
  if (views >= 3)  return "hsl(152 57% 80%)"
  return "hsl(152 57% 93%)"
}

export function ReportsClient({ matrix, documents }: { matrix: Investor[]; documents: Doc[] }) {
  if (matrix.length === 0) {
    return <div className="card card-p text-center py-10 text-sm" style={{ color: "hsl(var(--text-muted))" }}>No investors with access yet.</div>
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Investors", value: matrix.length },
          { label: "Documents", value: documents.length },
          { label: "Avg Engagement", value: `${Math.round(matrix.reduce((s, i) => s + i.score, 0) / matrix.length)}%` },
          { label: "Hot Investors", value: matrix.filter(i => i.score >= 60).length },
        ].map(s => (
          <div key={s.label} className="card card-p">
            <p className="text-2xl font-bold" style={{ color: "hsl(var(--text))" }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-subtle))" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Engagement matrix */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="card-title">Engagement Matrix</h3>
          <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Cell = number of document views</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table" style={{ minWidth: "max-content" }}>
            <thead>
              <tr>
                <th style={{ minWidth: 180 }}>Investor</th>
                <th style={{ minWidth: 60 }}>Score</th>
                {documents.map(d => (
                  <th key={d.id} style={{ minWidth: 80, maxWidth: 120, fontSize: "0.625rem" }} title={d.name}>
                    {d.name.length > 14 ? d.name.slice(0, 14) + "…" : d.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.sort((a, b) => b.score - a.score).map(inv => (
                <tr key={inv.userId}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{ background: "hsl(var(--accent-light))", color: "hsl(var(--accent))" }}>
                        {inv.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{inv.name}</p>
                        {inv.company && <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{inv.company}</p>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--bg-subtle))" }}>
                        <div className="h-full rounded-full" style={{ width: `${inv.score}%`, background: inv.score >= 60 ? "hsl(var(--success))" : inv.score >= 30 ? "hsl(var(--warning))" : "hsl(var(--border-strong))" }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: inv.score >= 60 ? "hsl(var(--success))" : "hsl(var(--text-subtle))" }}>{inv.score}</span>
                    </div>
                  </td>
                  {documents.map(doc => {
                    const ds = inv.docScores.find(d => d.docId === doc.id)
                    const views = ds?.views ?? 0
                    return (
                      <td key={doc.id} className="text-center" style={{ background: heatColor(views), fontSize: "0.75rem", fontWeight: views > 0 ? 600 : 400 }}>
                        {views > 0 ? views : <span style={{ color: "hsl(var(--border-strong))" }}>—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
