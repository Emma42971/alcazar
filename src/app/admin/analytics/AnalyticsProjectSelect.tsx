"use client"
export function AnalyticsProjectSelect({ projects, current }: { projects: {id:string;name:string}[]; current?: string }) {
  return (
    <select
      value={current ?? ""}
      onChange={e => { window.location.href = e.target.value ? `/admin/analytics?project=${e.target.value}` : '/admin/analytics' }}
      className="input select"
      style={{ width: "auto", minWidth: "160px" }}
    >
      <option value="">All projects</option>
      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  )
}
