export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { WorkflowsClient } from "./WorkflowsClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Workflows" }

export default async function WorkflowsPage() {
  const [rules, projects] = await Promise.all([
    prisma.workflowRule.findMany({
      include: { logs: { orderBy: { executedAt: "desc" }, take: 3 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({ select: { id: true, name: true } }),
  ])
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Workflow Automation</h1><p className="page-subtitle">Automate actions based on investor events</p></div>
      </div>
      <WorkflowsClient rules={rules as any} projects={projects} />
    </div>
  )
}
