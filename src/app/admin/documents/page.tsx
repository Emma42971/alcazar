export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { DocumentsClient } from "./DocumentsClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Documents" }
export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project: pid } = await searchParams
  const projects = await prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  const projectId = pid ?? projects[0]?.id ?? ""
  const docs = projectId ? await prisma.document.findMany({
    where: { projectId, supersededBy: null },
    include: { versions: { orderBy: { uploadedAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  }) : []
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>Documents</h1>
        {projects.length > 1 && (
          <select defaultValue={projectId} onChange={e => window.location.href = `/admin/documents?project=${e.target.value}`} className="rounded-lg px-3 py-1.5 text-sm" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 70%)", appearance: "auto" }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>
      <DocumentsClient projectId={projectId} documents={JSON.parse(JSON.stringify(docs))} />
    </div>
  )
}
