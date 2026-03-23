export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { ESignClient } from "./ESignClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "E-Signatures" }

export default async function ESignPage() {
  const [requests, projects, investors] = await Promise.all([
    prisma.eSignatureRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        document: { select: { name: true } },
        project: { select: { name: true } },
        recipient: { include: { profile: true } },
      }
    }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "INVESTOR", status: "APPROVED" }, include: { profile: true } })
  ])
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">E-Signatures</h1>
          <p className="page-subtitle">{requests.filter(r => r.status === "PENDING").length} pending signature</p>
        </div>
      </div>
      <ESignClient
        requests={requests.map(r => ({
          id: r.id, status: r.status,
          documentName: r.document.name,
          projectName: r.project.name,
          recipientName: r.recipient.profile ? `${r.recipient.profile.firstName} ${r.recipient.profile.lastName}` : r.recipient.email,
          createdAt: r.createdAt.toISOString(),
          signedAt: r.signedAt?.toISOString() ?? null,
        }))}
        projects={projects}
        investors={investors.map(i => ({ id: i.id, name: i.profile ? `${i.profile.firstName} ${i.profile.lastName}` : i.email }))}
      />
    </div>
  )
}
