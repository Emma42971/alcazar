export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { sendQaAnswerEmail } from "@/lib/email"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params
  const { answer, isShared } = await req.json()

  const q = await prisma.projectQuestion.update({
    where: { id },
    data: {
      answer: answer ?? undefined,
      isShared: isShared ?? undefined,
      answeredAt: answer ? new Date() : undefined,
      answeredBy: answer ? admin.id : undefined,
    },
    include: {
      user: { include: { profile: { select: { firstName: true } } } },
      project: { select: { name: true } },
    }
  })

  // Email investisseur si réponse
  if (answer) {
    try {
      const firstName = q.user.profile?.firstName ?? "Investor"
      await sendQaAnswerEmail(q.user.email, firstName, q.project.name, q.question, answer)
    } catch (e) {
      console.error("Email error:", e)
    }
  }

  return NextResponse.json({ success: true })
}
