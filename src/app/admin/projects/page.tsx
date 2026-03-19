import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ProjectRowActions } from "./ProjectRowActions"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Projects" }
export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({ orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }] })
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>Projects</h1>
        <Link href="/admin/projects/new" className="text-sm px-4 py-2 rounded-lg font-medium" style={{ background: "hsl(0 0% 98%)", color: "hsl(0 0% 5%)" }}>+ New Project</Link>
      </div>
      {projects.length === 0 ? (
        <div className="text-center py-20 rounded-xl border" style={{ borderColor: "hsl(0 0% 11%)" }}>
          <div className="text-4xl mb-4">🏢</div>
          <p className="text-sm mb-4" style={{ color: "hsl(0 0% 45%)" }}>No projects yet.</p>
          <Link href="/admin/projects/new" className="text-sm px-4 py-2 rounded-lg font-medium" style={{ background: "hsl(0 0% 98%)", color: "hsl(0 0% 5%)" }}>Create first project</Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(0 0% 11%)" }}>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Project</th><th>Status</th><th>Teaser</th><th>2FA</th><th>Closing</th><th>Actions</th></tr></thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {p.logoImage && <img src={p.logoImage} alt="" className="h-7 w-7 rounded-lg object-cover shrink-0" style={{ border: "1px solid hsl(0 0% 15%)" }}/>}
                        <div>
                          <p className="text-sm font-medium" style={{ color: "hsl(0 0% 88%)" }}>{p.name}</p>
                          {p.isFeatured && <span className="badge badge-new text-xs">Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-approved text-xs">{p.status}</span></td>
                    <td><span className={`badge text-xs ${p.teaserPublic ? "badge-approved" : "badge-read"}`}>{p.teaserPublic ? "Public" : "Private"}</span></td>
                    <td><span className={`badge text-xs ${p.twoFaRequired ? "badge-new" : "badge-read"}`}>{p.twoFaRequired ? "On" : "Off"}</span></td>
                    <td className="text-xs whitespace-nowrap" style={{ color: "hsl(0 0% 45%)" }}>{p.closingDate ? new Date(p.closingDate).toLocaleDateString() : "—"}</td>
                    <td><ProjectRowActions projectId={p.id} slug={p.slug} isFeatured={p.isFeatured} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
