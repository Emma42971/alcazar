export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { BulkEmailClient } from "./BulkEmailClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Bulk Email" }

export default async function BulkEmailPage() {
  const [campaigns, projects, investorCount] = await Promise.all([
    prisma.bulkEmailCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.project.findMany({ select: { id: true, name: true } }),
    prisma.user.count({ where: { role: "INVESTOR", status: "APPROVED" } }),
  ])
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Bulk Email</h1><p className="page-subtitle">{investorCount} approved investors</p></div>
      </div>
      <BulkEmailClient campaigns={campaigns as any} projects={projects} investorCount={investorCount} />
    </div>
  )
}
