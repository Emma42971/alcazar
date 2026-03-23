export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Building2, TrendingUp, MapPin, Shield, FileCheck, ArrowRight, ExternalLink } from "lucide-react"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const listing = await prisma.listing.findUnique({ where: { seoSlug: slug } })
  return {
    title: listing?.seoTitle ?? listing?.title ?? "Investment Opportunity",
    description: listing?.seoDescription ?? listing?.shortDesc,
  }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const listing = await prisma.listing.findUnique({
    where: { seoSlug: slug, status: "ACTIVE" },
    include: { category: true }
  })
  if (!listing) notFound()

  // Increment view count
  await prisma.listing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } })

  const project = await prisma.project.findUnique({
    where: { id: listing.projectId },
    select: {
      id: true, name: true, slug: true, coverImage: true,
      description: true, summary: true, sector: true,
      highlights: true, targetRaise: true, raisedAmount: true,
      expectedDuration: true, riskLevel: true,
    }
  })

  const tenant = await prisma.tenant.findUnique({
    where: { id: listing.tenantId },
    select: { name: true, slug: true }
  })

  const highlights = (project?.highlights as string[]) ?? []
  const raisedPct = project?.targetRaise && project?.raisedAmount
    ? Math.min(100, Math.round((Number(project.raisedAmount) / Number(project.targetRaise)) * 100))
    : null

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      {/* Nav */}
      <div className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"
        style={{ background: "hsl(var(--surface))", borderBottom: "1px solid hsl(var(--border))" }}>
        <Link href="/marketplace" className="btn btn-ghost btn-sm">← Marketplace</Link>
        <Link href={`/projects/${project?.slug}`} className="btn btn-primary btn-sm">
          Access Data Room <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Hero */}
      <div className="h-64 relative" style={{ background: "hsl(var(--navy))" }}>
        {project?.coverImage && (
          <img src={project.coverImage} alt={listing.title} className="w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          {listing.category && (
            <span className="text-sm mb-2" style={{ color: "hsl(var(--emerald))" }}>
              {listing.category.icon} {listing.category.name}
            </span>
          )}
          <h1 className="text-3xl font-bold text-white tracking-tight">{listing.title}</h1>
          {listing.region && (
            <p className="mt-1 text-sm flex items-center gap-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              <MapPin className="h-3.5 w-3.5" />{listing.region}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card card-p">
            <h2 className="card-title mb-3">Overview</h2>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--text-subtle))" }}>
              {project?.description ?? project?.summary ?? listing.shortDesc}
            </p>
          </div>

          {highlights.length > 0 && (
            <div className="card card-p">
              <h2 className="card-title mb-3">Key Highlights</h2>
              <ul className="space-y-2">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "hsl(var(--text))" }}>
                    <span className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white mt-0.5"
                      style={{ background: "hsl(var(--emerald))" }}>{i + 1}</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card card-p">
            <h2 className="card-title mb-3">Access Full Due Diligence</h2>
            <p className="text-sm mb-4" style={{ color: "hsl(var(--text-muted))" }}>
              Sign an NDA to access the complete data room including financials, legal documents, and management presentations.
            </p>
            <div className="flex gap-3">
              <Link href={`/projects/${project?.slug}`} className="btn btn-primary">
                <FileCheck className="h-4 w-4" />Request Access
              </Link>
              <Link href="/auth/register" className="btn btn-secondary">
                Create Account
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card card-p space-y-4">
            {listing.targetReturn && (
              <div className="text-center py-3 rounded-lg" style={{ background: "hsl(var(--emerald-light))" }}>
                <p className="text-3xl font-bold" style={{ color: "hsl(var(--emerald))" }}>{listing.targetReturn}%</p>
                <p className="text-xs mt-1" style={{ color: "hsl(var(--emerald))" }}>Target Annual Return</p>
              </div>
            )}

            <div className="space-y-3">
              {[
                ["Min. Investment", listing.minTicketUsd ? `${listing.currency} ${listing.minTicketUsd.toLocaleString()}` : null],
                ["Duration", project?.expectedDuration],
                ["Risk Level", project?.riskLevel],
                ["Sector", project?.sector],
                ["Closing Date", listing.closingDate ? new Date(listing.closingDate).toLocaleDateString() : null],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                  <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{label}</span>
                  <span className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>{value}</span>
                </div>
              ))}
            </div>

            {raisedPct !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                  <span>Funding Progress</span><span>{raisedPct}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill progress-emerald" style={{ width: `${raisedPct}%` }} /></div>
              </div>
            )}

            <Link href={`/projects/${project?.slug}`} className="btn btn-primary w-full">
              Access Data Room <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {tenant && (
            <div className="card card-p">
              <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Listed by</p>
              <p className="font-medium mt-1" style={{ color: "hsl(var(--text))" }}>{tenant.name}</p>
            </div>
          )}

          <div className="card card-p space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" style={{ color: "hsl(var(--emerald))" }} />
              <span className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>Secure Platform</span>
            </div>
            <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
              All documents are NDA-protected with end-to-end encryption and audit trails.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
