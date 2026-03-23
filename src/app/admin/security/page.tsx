export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { SecurityClient } from "./SecurityClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Sécurité" }

export default async function SecurityPage() {
  const [projects, events, accessRules] = await Promise.all([
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.securityEvent.findMany({
      orderBy: { createdAt: "desc" }, take: 50
    }),
    prisma.documentAccessRule.findMany({
      orderBy: { createdAt: "desc" }, take: 50
    })
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sécurité</h1>
          <p className="page-subtitle">Contrôle d'accès avancé, logs de sécurité, Fence View</p>
        </div>
      </div>
      <SecurityClient
        projects={projects}
        events={JSON.parse(JSON.stringify(events.map(e => ({ ...e, createdAt: e.createdAt.toISOString() }))))}
        accessRules={JSON.parse(JSON.stringify(accessRules.map(r => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          accessStartAt: r.accessStartAt?.toISOString() ?? null,
          accessEndAt: r.accessEndAt?.toISOString() ?? null,
        }))))}
      />
    </div>
  )
}
