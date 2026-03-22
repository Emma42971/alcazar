export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { ComplianceClient } from "./ComplianceClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Compliance" }

export default async function CompliancePage() {
  const [ndas, kycs, esigns] = await Promise.all([
    prisma.ndaRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { include: { profile: true } },
        project: { select: { name: true, id: true } }
      }
    }),
    prisma.kycDocument.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { include: { profile: true } } }
    }),
    prisma.eSignatureRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        recipient: { include: { profile: true } },
        document: { select: { name: true } },
        project: { select: { name: true } }
      }
    })
  ])

  const serialize = (obj: any) => JSON.parse(JSON.stringify(obj))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance</h1>
          <p className="page-subtitle">
            {ndas.filter(n => n.status === "PENDING").length} NDAs · {kycs.filter(k => k.status === "PENDING").length} KYC · {esigns.filter(e => e.status === "PENDING").length} E-Sign en attente
          </p>
        </div>
      </div>
      <ComplianceClient ndas={serialize(ndas)} kycs={serialize(kycs)} esigns={serialize(esigns)} />
    </div>
  )
}
