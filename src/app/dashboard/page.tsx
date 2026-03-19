export const dynamic = "force-dynamic"
import { requireInvestor } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { InvestorHeader } from "@/components/investor/InvestorHeader"
import { ProjectCard } from "@/components/shared/ProjectCard"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "My Projects" }

export default async function DashboardPage() {
  const user = await requireInvestor()

  const grants = await prisma.accessGrant.findMany({
    where: { userId: user.id },
    include: { project: true },
    orderBy: { grantedAt: "desc" },
  })

  const pendingNdas = await prisma.ndaRequest.findMany({
    where: { userId: user.id, status: "PENDING" },
    include: { project: { select: { name: true, slug: true } } },
  })

  return (
    <div className="min-h-screen" style={{ background: "hsl(0 0% 3.5%)" }}>
      <InvestorHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: "'DM Serif Display',serif" }}>My Projects</h1>
          <p className="mt-1.5 text-sm" style={{ color: "hsl(0 0% 45%)" }}>Projects you have access to.</p>
        </div>

        {/* Pending NDAs notice */}
        {pendingNdas.length > 0 && (
          <div className="rounded-xl border p-4 space-y-2" style={{ background: "hsl(38 92% 50% / 0.06)", borderColor: "hsl(38 92% 50% / 0.2)" }}>
            <p className="text-sm font-medium" style={{ color: "hsl(38 92% 60%)" }}>⏳ NDAs pending review</p>
            <div className="space-y-1">
              {pendingNdas.map(nda => (
                <p key={nda.id} className="text-xs" style={{ color: "hsl(0 0% 55%)" }}>
                  {nda.project.name} — awaiting admin approval
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Project grid */}
        {grants.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl">🔒</div>
            <p className="font-medium" style={{ fontFamily: "'DM Serif Display',serif" }}>No active project access yet</p>
            <p className="text-sm" style={{ color: "hsl(0 0% 45%)" }}>Browse the catalogue and sign an NDA to request access.</p>
            <Link href="/projects" className="inline-flex px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "hsl(0 0% 98%)", color: "hsl(0 0% 5%)" }}>
              Browse Catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {grants.map(g => (
              <Link key={g.id} href={`/dashboard/${g.project.slug}`}>
                <ProjectCard project={g.project} hasAccess={true} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
