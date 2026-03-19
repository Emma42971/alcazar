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
    <div className="min-h-screen" style={{ background: "hsl(0 0% 3.5%)" }}>
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b" style={{ borderColor: "hsl(0 0% 10%)" }}>
        <span className="text-sm font-medium" style={{ color: "hsl(0 0% 70%)" }}>Investor Portal</span>
        {user ? (
          <Link href={user.role === "ADMIN" ? "/admin" : "/dashboard"} className="text-sm" style={{ color: "hsl(0 0% 50%)" }}>
            Dashboard →
          </Link>
        ) : (
          <Link href="/" className="text-xs px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "hsl(0 0% 98%)", color: "hsl(0 0% 5%)" }}>
            Sign In
          </Link>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: "'DM Serif Display',serif" }}>Investment Opportunities</h1>
          <p className="mt-2 text-sm" style={{ color: "hsl(0 0% 45%)" }}>
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
                borderColor: !sector ? "hsl(0 0% 70%)" : "hsl(0 0% 18%)",
                color: !sector ? "hsl(0 0% 90%)" : "hsl(0 0% 45%)",
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
                  borderColor: sector === s ? "hsl(0 0% 70%)" : "hsl(0 0% 18%)",
                  color: sector === s ? "hsl(0 0% 90%)" : "hsl(0 0% 45%)",
                }}
              >
                {s}
              </Link>
            ))}
          </div>
        )}

        {/* Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20" style={{ color: "hsl(0 0% 30%)" }}>
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
