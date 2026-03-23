export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { KycClient } from "./KycClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "KYC/AML" }

export default async function KycPage() {
  const docs = await prisma.kycDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { include: { profile: true } } }
  })
  const serialized = docs.map(d => ({
    id: d.id, docType: d.docType, fileName: d.fileName, filePath: d.filePath,
    status: d.status, adminNote: d.adminNote,
    createdAt: d.createdAt.toISOString(),
    investorName: d.user.profile ? `${d.user.profile.firstName} ${d.user.profile.lastName}` : d.user.email,
    userId: d.userId,
  }))
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">KYC / AML</h1>
          <p className="page-subtitle">{docs.filter(d => d.status === "PENDING").length} pending review</p>
        </div>
      </div>
      <KycClient docs={serialized} />
    </div>
  )
}
