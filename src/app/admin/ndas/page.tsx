export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { NdaActionsClient } from "./NdaActionsClient"
import { FileCheck } from "lucide-react"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "NDAs" }

export default async function NdasPage() {
  const ndas = await prisma.ndaRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user:    { include: { profile: { select: { firstName: true, lastName: true } } } },
      project: { select: { name: true } },
    },
  })

  const pending  = ndas.filter(n => n.status === "PENDING")
  const reviewed = ndas.filter(n => n.status !== "PENDING")

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">NDAs</h1>
          <p className="page-subtitle">{pending.length} pending review · {reviewed.length} reviewed</p>
        </div>
      </div>

      {ndas.length === 0 ? (
        <div className="card card-p text-center py-12">
          <FileCheck className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(var(--text-muted))" }} />
          <p className="font-medium" style={{ color: "hsl(var(--text))" }}>No NDAs submitted yet</p>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--text-subtle))" }}>
            NDA requests will appear here once investors submit them.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Investor</th><th>Project</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
              <tbody>
                {ndas.map(n => {
                  const name = n.user.profile ? `${n.user.profile.firstName} ${n.user.profile.lastName}` : n.user.email
                  return (
                    <tr key={n.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                            style={{ background: "hsl(var(--accent-light))", color: "hsl(var(--accent))" }}>
                            {name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{name}</p>
                            <p className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{n.signerFullName ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "hsl(var(--text-subtle))" }}>{n.project.name}</td>
                      <td>
                        <span className={`badge ${n.status === "APPROVED" ? "badge-green" : n.status === "PENDING" ? "badge-yellow" : "badge-red"}`}>
                          {n.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "hsl(var(--text-subtle))" }}>
                        {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td>
                        {n.status === "PENDING"
                          ? <NdaActionsClient id={n.id} signedPdfPath={n.signedPdfPath} />
                          : <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Reviewed</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
