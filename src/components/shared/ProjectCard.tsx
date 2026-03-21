"use client"
import Link from "next/link"
import { formatCurrency, formatIrr, countdownDays, fundraisingPercent } from "@/lib/utils"

type Project = {
  id: string
  name: string
  slug: string
  summary: string | null
  country: string | null
  sector: string | null
  status: string
  isFeatured: boolean
  coverImage: string | null
  logoImage: string | null
  closingDate: Date | string | null
  targetRaise: bigint | number | null
  raisedAmount: bigint | number | null
  minTicket: number | null
  irrTargetBps: number | null
  publicMetrics: any
}

type Props = {
  project: Project
  hasAccess?: boolean
}

function metricVisible(publicMetrics: any, key: string): boolean {
  if (!publicMetrics) return true
  const pm = typeof publicMetrics === "string" ? JSON.parse(publicMetrics) : publicMetrics
  return pm[key] !== false
}

export function ProjectCard({ project, hasAccess }: Props) {
  const pct  = fundraisingPercent(
    project.raisedAmount ? BigInt(Math.round(Number(project.raisedAmount))) : null,
    project.targetRaise  ? BigInt(Math.round(Number(project.targetRaise)))  : null
  )
  const days = countdownDays(project.closingDate ? new Date(project.closingDate) : null)
  const showIrr    = (hasAccess || metricVisible(project.publicMetrics, "irr"))       && project.irrTargetBps
  const showTicket = (hasAccess || metricVisible(project.publicMetrics, "minTicket")) && project.minTicket

  const statusColor: Record<string, string> = {
    "Open":         "badge-approved",
    "Fundraising":  "badge-new",
    "Goal Reached": "badge-approved",
    "Closed":       "badge-read",
    "Coming Soon":  "badge-pending",
  }

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block rounded-xl border overflow-hidden transition-all duration-200 hover:border-zinc-600"
      style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
    >
      {/* Cover */}
      <div className="h-40 overflow-hidden relative" style={{ background: "hsl(var(--accent))" }}>
        {project.coverImage ? (
          <img src={project.coverImage} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: "hsl(var(--border))" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
        )}
        {project.isFeatured && (
          <span className="absolute top-2.5 left-2.5 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
            Featured
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          {project.logoImage && (
            <img src={project.logoImage} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0 mt-0.5" style={{ border: "1px solid hsl(var(--border))" }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{project.name}</h3>
              <span className={`badge ${statusColor[project.status] ?? "badge-read"} shrink-0`} style={{ fontSize: "10px" }}>
                {project.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              {project.sector && <span>{project.sector}</span>}
              {project.sector && project.country && <span>·</span>}
              {project.country && <span>{project.country}</span>}
            </div>
          </div>
        </div>

        {project.summary && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            {project.summary}
          </p>
        )}

        {(showIrr || showTicket) && (
          <div className="flex items-center gap-4 pt-0.5">
            {showIrr && (
              <div>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>IRR Target</p>
                <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{formatIrr(project.irrTargetBps)}</p>
              </div>
            )}
            {showTicket && (
              <div>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Min. Ticket</p>
                <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(project.minTicket)}</p>
              </div>
            )}
          </div>
        )}

        {pct !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span>Raised</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--accent))" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "hsl(var(--foreground))" }} />
            </div>
          </div>
        )}

        {days !== null && days >= 0 && (
          <p className="text-xs" style={{ color: "hsl(38 92% 55%)" }}>
            Closes in {days} day{days !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Link>
  )
}
