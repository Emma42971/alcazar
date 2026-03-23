export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { scoreDeal } from "@/lib/ai-v2"

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { projectId } = await req.json()
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const score = await scoreDeal({
    name: project.name,
    sector: project.sector,
    description: project.description,
    targetRaise: project.targetRaise ? Number(project.targetRaise) : null,
    minTicket: project.minTicket,
    irrTargetBps: project.irrTargetBps,
    riskLevel: project.riskLevel,
    lifecycle: project.lifecycle,
  })
  return NextResponse.json(score)
}
