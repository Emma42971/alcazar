import { prisma } from "@/lib/prisma"

export async function getEngagementScore(userId: string, projectId: string): Promise<number> {
  const [activityRow, returnVisitRows, inquiryCount, questionCount] = await Promise.all([
    prisma.documentActivity.aggregate({
      where: { userId, projectId, event: "open" },
      _count: { id: true },
      _sum: { durationMs: true },
    }),
    prisma.documentActivity.groupBy({
      by: ["documentId"],
      where: { userId, projectId, event: "open" },
      having: { documentId: { _count: { gt: 1 } } },
    }),
    prisma.contactInquiry.count({ where: { userId, projectId } }),
    prisma.projectQuestion.count({ where: { userId, projectId } }),
  ])

  const uniqueDocs   = activityRow._count.id
  const totalMs      = activityRow._sum.durationMs ?? 0
  const returnVisits = returnVisitRows.length

  let score = 0
  score += Math.min(40, uniqueDocs  * 10)
  score += Math.min(20, (totalMs / 1000) * 0.05)
  score += Math.min(15, inquiryCount * 15)
  score += Math.min(15, questionCount * 10)
  score += Math.min(10, returnVisits * 5)

  return Math.min(100, Math.round(score))
}

export function engagementLabel(score: number): "Hot" | "Warm" | "Cool" | "Cold" {
  if (score >= 70) return "Hot"
  if (score >= 35) return "Warm"
  if (score >= 10) return "Cool"
  return "Cold"
}

export function engagementColor(score: number): string {
  if (score >= 70) return "text-green-400"
  if (score >= 35) return "text-amber-400"
  return "text-zinc-500"
}
