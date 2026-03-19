import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
export async function GET() {
  await requireAdmin()
  const investors = await prisma.user.findMany({ where: { role: "INVESTOR" }, include: { profile: true, ndaRequests: { orderBy: { createdAt: "desc" }, take: 1 }, accessGrants: { take: 1 } }, orderBy: { createdAt: "desc" } })
  const rows = investors.map(u => {
    const nda = u.ndaRequests[0]; const access = u.accessGrants[0]
    return [u.profile?.firstName, u.profile?.lastName, u.email, u.profile?.phone, u.profile?.companyName, u.profile?.country, u.profile?.investorType, u.profile?.estTicket, u.status, nda?.status ?? "NONE", nda?.signedAt?.toISOString().split("T")[0], access?.grantedAt?.toISOString().split("T")[0], u.createdAt.toISOString().split("T")[0]].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
  })
  const csv = [["First Name","Last Name","Email","Phone","Company","Country","Type","Ticket","Status","NDA","NDA Signed","Access Granted","Registered"].map(h => `"${h}"`).join(","), ...rows].join("\n")
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="investors-${new Date().toISOString().split("T")[0]}.csv"` } })
}
