export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  await requireAdmin()
  const projectId = req.nextUrl.searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 })

  const activities = await prisma.documentActivity.findMany({
    where: { projectId },
    include: {
      user: { include: { profile: true } },
      document: { select: { name: true } },
    },
    orderBy: { viewedAt: "desc" },
  })

  const rows = [
    ["Time", "Investor", "Email", "Company", "Document", "Event", "Duration (s)"],
    ...activities.map(a => [
      a.viewedAt.toISOString(),
      a.user.profile ? `${a.user.profile.firstName} ${a.user.profile.lastName}` : a.user.email,
      a.user.email,
      a.user.profile?.companyName ?? "",
      a.document.name,
      a.event,
      a.durationMs ? String(Math.round(a.durationMs / 1000)) : "0",
    ])
  ]

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="activity-report-${new Date().toISOString().split("T")[0]}.csv"`,
    }
  })
}
