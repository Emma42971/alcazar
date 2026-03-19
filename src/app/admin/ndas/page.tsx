export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { NdaActionsClient } from "./NdaActionsClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "NDA Requests" }
export default async function NdasPage() {
  const ndas = await prisma.ndaRequest.findMany({
    include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } }, project: { select: { name: true, id: true } } },
    orderBy: { createdAt: "desc" },
  })
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>NDA Requests</h1>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(0 0% 11%)" }}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Investor</th><th>Project</th><th>Status</th><th>Signed</th><th>Actions</th></tr></thead>
            <tbody>
              {ndas.map(n => {
                const name = n.user.profile ? `${n.user.profile.firstName} ${n.user.profile.lastName}` : n.user.email
                return (
                  <tr key={n.id}>
                    <td><p className="text-sm font-medium" style={{ color: "hsl(0 0% 88%)" }}>{name}</p><p className="text-xs" style={{ color: "hsl(0 0% 40%)" }}>{n.user.email}</p></td>
                    <td className="text-sm" style={{ color: "hsl(0 0% 65%)" }}>{n.project.name}</td>
                    <td><span className={`badge text-xs badge-${n.status === "APPROVED" ? "approved" : n.status === "REJECTED" ? "rejected" : "pending"}`}>{n.status}</span></td>
                    <td className="text-xs whitespace-nowrap" style={{ color: "hsl(0 0% 40%)" }}>{n.signedAt ? new Date(n.signedAt).toLocaleDateString() : "—"}</td>
                    <td><NdaActionsClient ndaId={n.id} status={n.status} pdfPath={n.signedPdfPath} /></td>
                  </tr>
                )
              })}
              {ndas.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-sm" style={{ color: "hsl(0 0% 35%)" }}>No NDA requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
