export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { CreateAdminClient } from "./CreateAdminClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Team" }
export default async function TeamPage() {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } })
  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-2xl">
      <h1 className="page-title">Équipe</h1>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
        <table className="data-table">
          <thead><tr><th>Email</th><th>Joined</th></tr></thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id}>
                <td className="text-sm" style={{ color: "hsl(var(--text))" }}>{a.email}</td>
                <td className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>{a.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CreateAdminClient />
    </div>
  )
}
