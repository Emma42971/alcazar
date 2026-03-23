export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { detectRedFlags } from "@/lib/ai-v2"

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { projectId } = await req.json()
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const content = `${project.name}\n${project.description ?? ""}\n${project.ndaText ?? ""}`
  const result = await detectRedFlags(content)
  return NextResponse.json(result)
}
