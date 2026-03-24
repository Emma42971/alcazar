export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  await requireAdmin()
  const projectId = req.nextUrl.searchParams.get("projectId")
  const questions = await prisma.projectQuestion.findMany({
    where: projectId ? { projectId } : {},
    include: {
      user:    { include: { profile: true } },
      project: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Simple CSV export
  const rows = [
    ["Project", "Investor", "Category", "Status", "Question", "Answer", "Date", "Answered At"],
    ...questions.map(q => [
      q.project.name,
      q.user.profile ? `${q.user.profile?.firstName} ${q.user.profile?.lastName}` : q.user.email,
      q.category,
      q.status,
      q.question.replace(/"/g, '""'),
      (q.answer ?? "").replace(/"/g, '""'),
      q.createdAt.toISOString().split("T")[0],
      q.answeredAt ? q.answeredAt.toISOString().split("T")[0] : "",
    ])
  ]

  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="qa-export-${new Date().toISOString().split("T")[0]}.csv"`,
    }
  })
}
