export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { DocumentsClient } from "./DocumentsClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Documents" }

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project: projectId } = await searchParams
  const projects = await prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  const currentProject = projectId ?? projects[0]?.id ?? null

  const [documents, folders] = currentProject ? await Promise.all([
    prisma.document.findMany({
      where: { projectId: currentProject },
      include: { versions: { select: { id: true } } },
      orderBy: [{ folderId: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.documentFolder.findMany({
      where: { projectId: currentProject },
      orderBy: [{ sortOrder: "asc" }, { index: "asc" }],
    }),
  ]) : [[], []]

  const serializedDocs = documents.map(d => ({
    ...d,
    sizeBytes: d.sizeBytes ?? null,
    targetRaise: undefined,
    createdAt: d.createdAt.toISOString(),
    versions: d.versions,
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">{documents.length} files · {folders.length} folders</p>
        </div>
        {projects.length > 1 && (
          <form method="GET">
            <select name="project" defaultValue={currentProject ?? ""} onChange={e => (e.target.form as HTMLFormElement)?.submit()} className="input select" style={{ width: "auto" }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </form>
        )}
      </div>
      {currentProject
        ? <DocumentsClient projectId={currentProject} documents={serializedDocs as any} folders={folders} />
        : <div className="card card-p text-center py-10 text-sm" style={{ color: "hsl(var(--text-muted))" }}>Create a project first to manage documents.</div>}
    </div>
  )
}
