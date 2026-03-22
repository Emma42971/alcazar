export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { DdChecklistClient } from "./DdChecklistClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Due Diligence Checklist" }

export default async function ChecklistPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project: projectId } = await searchParams
  const projects = await prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  const currentProject = projectId ?? projects[0]?.id ?? null

  const [items, documents] = currentProject ? await Promise.all([
    prisma.ddChecklistItem.findMany({
      where: { projectId: currentProject },
      include: { document: { select: { id: true, name: true, status: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.document.findMany({
      where: { projectId: currentProject },
      select: { id: true, name: true, status: true },
      orderBy: { name: "asc" },
    }),
  ]) : [[], []]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Due Diligence Checklist</h1>
          <p className="page-subtitle">{items.filter(i => i.documentId).length}/{items.length} items fulfilled</p>
        </div>
      </div>
      {currentProject
        ? <DdChecklistClient projectId={currentProject} items={items as any} documents={documents} />
        : <div className="card card-p text-center py-10 text-sm" style={{ color: "hsl(var(--text-muted))" }}>Create a project first.</div>}
    </div>
  )
}
