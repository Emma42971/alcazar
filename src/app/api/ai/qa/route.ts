export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { aiAnswerQuestion } from "@/lib/ai"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { question, projectId } = await req.json()
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const context = `Project: ${project.name}\nSector: ${project.sector ?? "N/A"}\nDescription: ${project.description ?? project.summary ?? "N/A"}`
  const answer = await aiAnswerQuestion(question, context)
  return NextResponse.json({ answer })
}
