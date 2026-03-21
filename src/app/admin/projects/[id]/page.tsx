export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProjectEditForm } from "../ProjectEditForm"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Edit Project" }

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) notFound()

  // Convertir BigInt en number pour la sérialisation vers le Client Component
  const serializable = {
    ...project,
    targetRaise:  project.targetRaise  ? Number(project.targetRaise)  : null,
    raisedAmount: project.raisedAmount ? Number(project.raisedAmount) : null,
    closingDate:  project.closingDate  ? project.closingDate.toISOString() : null,
    createdAt:    project.createdAt.toISOString(),
    updatedAt:    project.updatedAt.toISOString(),
  }

  return (
    <div className="p-4 sm:p-8">
      <ProjectEditForm project={serializable} />
    </div>
  )
}
