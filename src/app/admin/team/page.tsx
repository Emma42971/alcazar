export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { CreateAdminClient } from "./CreateAdminClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Team" }
export default async function TeamPage() {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } })
  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-2xl">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>Team</h1>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(0 0% 11%)" }}>
        <table className="data-table">
          <thead><tr><th>Email</th><th>Joined</th></tr></thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id}>
                <td className="text-sm" style={{ color: "hsl(0 0% 80%)" }}>{a.email}</td>
                <td className="text-xs" style={{ color: "hsl(0 0% 40%)" }}>{a.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CreateAdminClient />
    </div>
  )
}
