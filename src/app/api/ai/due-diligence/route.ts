export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { dueDiligenceAnalysis } from "@/lib/ai"

export async function POST(req: NextRequest) {
  try {
  await requireAdmin()
  const { projectId } = await req.json()

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const text = `${project.name}\n${project.description ?? project.summary ?? ""}\nSector: ${project.sector}\nRisk: ${project.riskLevel}`
  const analysis = await dueDiligenceAnalysis(text)
  return NextResponse.json(analysis)  } catch (e: any) {
    console.error("[AI]", e)
    return NextResponse.json({ error: "AI service error" }, { status: 500 })
  }
}
