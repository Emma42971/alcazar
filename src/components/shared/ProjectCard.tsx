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
  closingDate: Date | null
  targetRaise: bigint | null
  raisedAmount: bigint | null
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
  const pct  = fundraisingPercent(project.raisedAmount, project.targetRaise)
  const days = countdownDays(project.closingDate)
  const showIrr    = (hasAccess || metricVisible(project.publicMetrics, "irr"))    && project.irrTargetBps
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
      className="group block rounded-xl border overflow-hidden transition-all duration-200"
      style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 12%)" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "hsl(0 0% 20%)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "hsl(0 0% 12%)")}
    >
      {/* Cover */}
      <div className="h-40 overflow-hidden relative" style={{ background: "hsl(0 0% 8%)" }}>
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: "hsl(0 0% 20%)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
        )}
        {project.isFeatured && (
          <span
            className="absolute top-2.5 left-2.5 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: "hsl(0 0% 5%)", border: "1px solid hsl(0 0% 20%)", color: "hsl(0 0% 75%)" }}
          >
            Featured
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-2.5">
          {project.logoImage && (
            <img src={project.logoImage} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0 mt-0.5" style={{ border: "1px solid hsl(0 0% 15%)" }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-medium truncate" style={{ color: "hsl(0 0% 92%)" }}>{project.name}</h3>
              <span className={`badge ${statusColor[project.status] ?? "badge-read"} shrink-0`} style={{ fontSize: "10px" }}>
                {project.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "hsl(0 0% 40%)" }}>
              {project.sector && <span>{project.sector}</span>}
              {project.sector && project.country && <span>·</span>}
              {project.country && <span>{project.country}</span>}
            </div>
          </div>
        </div>

        {/* Summary */}
        {project.summary && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "hsl(0 0% 45%)" }}>
            {project.summary}
          </p>
        )}

        {/* Metrics */}
        {(showIrr || showTicket) && (
          <div className="flex items-center gap-4 pt-0.5">
            {showIrr && (
              <div>
                <p className="text-xs" style={{ color: "hsl(0 0% 35%)" }}>IRR Target</p>
                <p className="text-sm font-medium" style={{ color: "hsl(0 0% 90%)" }}>{formatIrr(project.irrTargetBps)}</p>
              </div>
            )}
            {showTicket && (
              <div>
                <p className="text-xs" style={{ color: "hsl(0 0% 35%)" }}>Min. Ticket</p>
                <p className="text-sm font-medium" style={{ color: "hsl(0 0% 90%)" }}>{formatCurrency(project.minTicket)}</p>
              </div>
            )}
            {!showIrr && project.irrTargetBps && (
              <div className="flex items-center gap-1" style={{ color: "hsl(0 0% 30%)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span className="text-xs">IRR visible after NDA</span>
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        {pct !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs" style={{ color: "hsl(0 0% 38%)" }}>
              <span>Raised</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 12%)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "hsl(0 0% 75%)" }} />
            </div>
          </div>
        )}

        {/* Countdown */}
        {days !== null && days >= 0 && (
          <p className="text-xs" style={{ color: "hsl(38 92% 55%)" }}>
            Closes in {days} day{days !== 1 ? "s" : ""}
          </p>
        )}
        {days !== null && days < 0 && (
          <p className="text-xs" style={{ color: "hsl(0 0% 30%)" }}>Closing date passed</p>
        )}
      </div>
    </Link>
  )
}
