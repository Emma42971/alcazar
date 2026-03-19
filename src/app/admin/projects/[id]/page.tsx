import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProjectEditForm } from "../ProjectEditForm"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Edit Project" }
export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) notFound()
  return (
    <div className="p-4 sm:p-8">
      <ProjectEditForm project={JSON.parse(JSON.stringify(project))} />
    </div>
  )
}
