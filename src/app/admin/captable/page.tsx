export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { CapTableClient } from "./CapTableClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Cap Table" }

export default async function CapTablePage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project: projectId } = await searchParams
  const projects = await prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  const currentProject = projectId ?? projects[0]?.id ?? null
  const entries = currentProject ? await prisma.capTableEntry.findMany({
    where: { projectId: currentProject }, orderBy: { amount: "desc" }
  }) : []
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Cap Table</h1><p className="page-subtitle">Ownership structure by project</p></div>
      </div>
      {currentProject
        ? <CapTableClient projectId={currentProject} entries={entries.map(e => ({ ...e, amount: Number(e.amount), shareClass: "", notes: (e as any).note ?? null }))} />
        : <div className="card card-p text-center py-10 text-sm" style={{ color: "hsl(var(--text-muted))" }}>No projects yet.</div>}
    </div>
  )
}
