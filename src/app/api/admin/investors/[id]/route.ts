export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { sendApprovalEmail } from "@/lib/email"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const body = await req.json()

  const user = await prisma.user.update({
    where: { id },
    data: { status: body.status },
    include: { profile: { select: { firstName: true } } },
  })

  // Email quand approuvé
  if (body.status === "APPROVED") {
    try {
      await sendApprovalEmail(user.email, user.profile?.firstName ?? "Investor")
    } catch (e) {
      console.error("Email error:", e)
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
