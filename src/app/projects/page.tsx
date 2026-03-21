export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { ProjectCard } from "@/components/shared/ProjectCard"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Investment Opportunities",
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string }>
}) {
  const { sector } = await searchParams
  const user = await getCurrentUser()

  const projects = await prisma.project.findMany({
    where: {
      ...(user ? {} : { teaserPublic: true }),
      ...(sector ? { sector } : {}),
    },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  })

  const sectors = await prisma.project.findMany({
    where: { teaserPublic: true, sector: { not: null } },
    select: { sector: true },
    distinct: ["sector"],
    orderBy: { sector: "asc" },
  })

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--surface))" }}>
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <span className="text-sm font-medium" style={{ color: "hsl(var(--text-subtle))" }}>Investor Portal</span>
        {user ? (
          <Link href={user.role === "ADMIN" ? "/admin" : "/dashboard"} className="text-sm" style={{ color: "hsl(var(--text-subtle))" }}>
            Dashboard →
          </Link>
        ) : (
          <Link href="/" className="text-xs px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "hsl(var(--surface))", color: "hsl(var(--text-subtle))" }}>
            Sign In
          </Link>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: "'DM Serif Display',serif" }}>Investment Opportunities</h1>
          <p className="mt-2 text-sm" style={{ color: "hsl(var(--text-subtle))" }}>
            Carefully selected projects for qualified investors.
          </p>
        </div>

        {/* Sector filters */}
        {sectors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/projects"
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={{
                borderColor: !sector ? "hsl(var(--accent))" : "hsl(var(--border))",
                color: !sector ? "hsl(var(--accent))" : "hsl(var(--text-subtle))",
              }}
            >
              All
            </Link>
            {sectors.map(({ sector: s }) => s && (
              <Link
                key={s}
                href={`/projects?sector=${encodeURIComponent(s)}`}
                className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  borderColor: sector === s ? "hsl(var(--accent))" : "hsl(var(--border))",
                  color: sector === s ? "hsl(var(--accent))" : "hsl(var(--text-subtle))",
                }}
              >
                {s}
              </Link>
            ))}
          </div>
        )}

        {/* Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20" style={{ color: "hsl(var(--text-subtle))" }}>
            <div className="text-5xl mb-4">📂</div>
            <p className="text-sm">No projects available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(p => (
              <ProjectCard key={p.id} project={p} hasAccess={false} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
