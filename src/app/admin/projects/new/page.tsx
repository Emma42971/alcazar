export const dynamic = "force-dynamic"
import { ProjectEditForm } from "../ProjectEditForm"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "New Project" }
export default function NewProjectPage() {
  return (
    <div className="p-4 sm:p-8">
      <ProjectEditForm project={null} />
    </div>
  )
}
