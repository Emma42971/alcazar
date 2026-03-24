export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { sendApprovalEmail } from "@/lib/email"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { status, pipelineStage } = body

    let user: any

    if (status) {
      user = await prisma.user.update({
        where: { id },
        data: { status },
        include: { profile: { select: { firstName: true } } },
      })
      if (status === "APPROVED") {
        try { await sendApprovalEmail(user.email, user.profile?.firstName ?? "Investor") } catch {}
      }
    }

    if (pipelineStage) {
      // Upsert profile in case it doesn't exist yet
      await prisma.investorProfile.upsert({
        where: { userId: id },
        update: { pipelineStage },
        create: {
          userId: id,
          firstName: "", lastName: "", email: "", phone: "",
          pipelineStage,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("[PATCH investors/id]", e)
    return NextResponse.json({ error: e.message ?? "Error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    })
    return NextResponse.json(user)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
