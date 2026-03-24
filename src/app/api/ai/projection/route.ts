export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { generateFinancialProjection } from "@/lib/ai-v2"

export async function POST(req: NextRequest) {
  try {
  await requireAdmin()
  const { projectId } = await req.json()
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const result = await generateFinancialProjection({
    targetRaise: project.targetRaise ? Number(project.targetRaise) : null,
    irrTargetBps: project.irrTargetBps,
    duration: project.expectedDuration,
    type: project.investmentType,
  })
  return NextResponse.json(result)  } catch (e: any) {
    console.error("[AI]", e)
    return NextResponse.json({ error: "AI service error" }, { status: 500 })
  }
}
