import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { notFound } from "next/navigation"
import { formatCurrency, formatIrr, countdownDays, fundraisingPercent } from "@/lib/utils"
import { NdaGate } from "@/components/shared/NdaGate"
import Link from "next/link"
import type { Metadata } from "next"

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await prisma.project.findUnique({ where: { slug }, select: { name: true, summary: true, seoIndexable: true } })
  if (!p) return {}
  return {
    title: p.name,
    description: p.summary ?? undefined,
    robots: p.seoIndexable ? { index: true, follow: true } : { index: false, follow: false },
  }
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { preview } = await searchParams
  const user = await getCurrentUser()

  const project = await prisma.project.findUnique({ where: { slug } })
  if (!project) notFound()

  // Access check
  const isAdmin      = user?.role === "ADMIN"
  const isPreview    = isAdmin && preview === "1"
  const hasAccess    = isAdmin && !isPreview
    ? true
    : user
    ? !!(await prisma.accessGrant.findUnique({ where: { userId_projectId: { userId: user.id, projectId: project.id } } }))
    : false

  const ndaRow = user
    ? await prisma.ndaRequest.findFirst({ where: { userId: user.id, projectId: project.id }, orderBy: { createdAt: "desc" } })
    : null

  if (!user && !project.teaserPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(0 0% 3.5%)" }}>
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="text-4xl">🔒</div>
          <h1 className="text-xl" style={{ fontFamily: "'DM Serif Display',serif" }}>Private project</h1>
          <p className="text-sm" style={{ color: "hsl(0 0% 45%)" }}>Sign in to access this project.</p>
          <Link href={`/?redirect=/projects/${slug}`} className="inline-flex px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "hsl(0 0% 98%)", color: "hsl(0 0% 5%)" }}>Sign In</Link>
        </div>
      </div>
    )
  }

  const gallery    = (project.gallery as string[] | null) ?? []
  const highlights = (project.highlights as string[] | null) ?? []
  const pct        = fundraisingPercent(project.raisedAmount, project.targetRaise)
  const days       = countdownDays(project.closingDate)
  const pm         = project.publicMetrics as Record<string, boolean> | null

  const metricVisible = (key: string) => hasAccess || pm?.[key] !== false

  const documents = hasAccess
    ? await prisma.document.findMany({ where: { projectId: project.id, supersededBy: null }, orderBy: { createdAt: "asc" } })
    : []

  return (
    <div className="min-h-screen" style={{ background: "hsl(0 0% 3.5%)" }}>
      {/* Breadcrumb */}
      <div className="border-b px-4 sm:px-6 py-2.5 flex items-center gap-2 text-xs" style={{ borderColor: "hsl(0 0% 10%)", color: "hsl(0 0% 40%)" }}>
        <Link href="/projects" className="hover:text-white transition-colors">All projects</Link>
        <span>›</span>
        <span style={{ color: "hsl(0 0% 70%)" }}>{project.name}</span>
        {isPreview && <span className="ml-2 px-2 py-0.5 rounded text-xs" style={{ background: "hsl(38 92% 50% / 0.15)", color: "hsl(38 92% 60%)", border: "1px solid hsl(38 92% 50% / 0.3)" }}>Preview mode</span>}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Cover */}
        {project.coverImage && (
          <div className="rounded-xl overflow-hidden h-56 sm:h-72" style={{ background: "hsl(0 0% 8%)" }}>
            <img src={project.coverImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-4">
          {project.logoImage && (
            <img src={project.logoImage} alt="" className="h-14 w-14 rounded-xl object-cover shrink-0 border" style={{ borderColor: "hsl(0 0% 15%)" }} />
          )}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {project.sector && (
                <Link href={`/projects?sector=${encodeURIComponent(project.sector)}`} className="text-xs px-2.5 py-1 rounded-full border transition-colors" style={{ borderColor: "hsl(0 0% 18%)", color: "hsl(0 0% 50%)" }}>
                  {project.sector}
                </Link>
              )}
              {project.country && <span className="text-xs" style={{ color: "hsl(0 0% 40%)" }}>📍 {project.country}</span>}
              <span className="badge badge-approved text-xs">{project.status}</span>
              {project.isFeatured && <span className="badge badge-new text-xs">Featured</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>{project.name}</h1>
            {project.summary && <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "hsl(0 0% 50%)" }}>{project.summary}</p>}
          </div>
        </div>

        {/* Countdown + progress */}
        <div className="space-y-3">
          {days !== null && days >= 0 && (
            <p className="text-sm font-medium" style={{ color: "hsl(38 92% 55%)" }}>
              ⏱ Closes in <strong>{days}</strong> day{days !== 1 ? "s" : ""}
            </p>
          )}
          {pct !== null && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color: "hsl(0 0% 45%)" }}>Raised</span>
                <span style={{ color: "hsl(0 0% 85%)" }}>
                  {formatCurrency(project.raisedAmount)}{project.targetRaise ? ` / ${formatCurrency(project.targetRaise)}` : ""}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 12%)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "hsl(0 0% 75%)" }} />
              </div>
            </div>
          )}
        </div>

        {/* Metrics */}
        {[
          { label: "IRR Target",    value: formatIrr(project.irrTargetBps),        show: metricVisible("irr") && !!project.irrTargetBps },
          { label: "Min. Ticket",   value: formatCurrency(project.minTicket),       show: metricVisible("minTicket") && !!project.minTicket },
          { label: "Target Raise",  value: formatCurrency(project.targetRaise),     show: !!project.targetRaise },
          { label: "Duration",      value: project.expectedDuration,                show: !!project.expectedDuration },
          { label: "Risk Level",    value: project.riskLevel,                       show: !!project.riskLevel },
          { label: "Type",          value: project.investmentType,                  show: !!project.investmentType },
        ].filter(m => m.show).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "IRR Target",    value: formatIrr(project.irrTargetBps),   show: metricVisible("irr") && !!project.irrTargetBps,    locked: !metricVisible("irr") && !!project.irrTargetBps },
              { label: "Min. Ticket",   value: formatCurrency(project.minTicket), show: metricVisible("minTicket") && !!project.minTicket,  locked: !metricVisible("minTicket") && !!project.minTicket },
              { label: "Target Raise",  value: formatCurrency(project.targetRaise), show: !!project.targetRaise, locked: false },
              { label: "Duration",      value: project.expectedDuration,           show: !!project.expectedDuration, locked: false },
              { label: "Risk",          value: project.riskLevel,                  show: !!project.riskLevel, locked: false },
              { label: "Type",          value: project.investmentType,             show: !!project.investmentType, locked: false },
            ].filter(m => m.show || m.locked).map(m => (
              <div key={m.label} className="relative rounded-xl p-4 border" style={{ background: "hsl(0 0% 6%)", borderColor: "hsl(0 0% 12%)" }}>
                {m.locked && (
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center" style={{ backdropFilter: "blur(4px)", background: "hsl(0 0% 4% / 0.7)" }}>
                    <span style={{ color: "hsl(0 0% 30%)" }}>🔒</span>
                  </div>
                )}
                <p className="text-xs mb-1" style={{ color: "hsl(0 0% 35%)" }}>{m.label}</p>
                <p className="text-sm font-medium" style={{ color: "hsl(0 0% 90%)" }}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(0 0% 35%)" }}>Key Highlights</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0" style={{ color: "hsl(0 0% 30%)" }}>›</span>
                  <p className="text-sm" style={{ color: "hsl(0 0% 60%)" }}>{h}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description (if access) */}
        {hasAccess && project.description && (
          <div className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(0 0% 35%)" }}>About this project</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(0 0% 55%)" }}>{project.description}</p>
          </div>
        )}

        {/* Video (if access) */}
        {hasAccess && project.videoUrl && (
          <div className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(0 0% 35%)" }}>Presentation</h2>
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", background: "hsl(0 0% 8%)" }}>
              <iframe src={project.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} className="w-full h-full" allowFullScreen />
            </div>
          </div>
        )}

        {/* Gallery (if access) */}
        {hasAccess && gallery.length > 1 && (
          <div className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(0 0% 35%)" }}>Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((img, i) => (
                <div key={i} className="rounded-lg overflow-hidden h-36" style={{ background: "hsl(0 0% 8%)" }}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents (if access) */}
        {hasAccess && !isPreview && (
          <div className="space-y-4">
            <h2 className="text-white font-medium">Data Room</h2>
            {documents.length === 0 ? (
              <p className="text-sm" style={{ color: "hsl(0 0% 35%)" }}>No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => {
                  const ext = doc.filePath.split(".").pop()?.toUpperCase() ?? "FILE"
                  const kb  = doc.sizeBytes ? (doc.sizeBytes < 1048576 ? `${Math.round(doc.sizeBytes / 1024)} KB` : `${(doc.sizeBytes / 1048576).toFixed(1)} MB`) : ""
                  return (
                    <div key={doc.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border" style={{ background: "hsl(0 0% 6%)", borderColor: "hsl(0 0% 12%)" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "hsl(0 0% 10%)", color: "hsl(0 0% 55%)" }}>{ext}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "hsl(0 0% 88%)" }}>{doc.name}</p>
                          <p className="text-xs" style={{ color: "hsl(0 0% 38%)" }}>{ext}{kb ? ` · ${kb}` : ""}{doc.version > 1 ? ` · v${doc.version}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <a href={`/api/files/${project.id}/${doc.filePath.split("/").pop()}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg border transition-colors" style={{ borderColor: "hsl(0 0% 18%)", color: "hsl(0 0% 60%)" }}>View</a>
                        <a href={`/api/files/${project.id}/${doc.filePath.split("/").pop()}?download=1`} className="text-xs px-2 py-1.5 rounded-lg border transition-colors" style={{ borderColor: "hsl(0 0% 18%)", color: "hsl(0 0% 60%)" }}>↓</a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* NDA Gate */}
        {!isPreview && (
          <NdaGate
            project={project}
            user={user}
            hasAccess={hasAccess}
            ndaStatus={ndaRow?.status ?? null}
          />
        )}
      </div>
    </div>
  )
}
