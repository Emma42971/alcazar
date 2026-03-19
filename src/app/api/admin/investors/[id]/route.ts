export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { status } = await req.json()
  const user = await prisma.user.update({ where: { id }, data: { status }, include: { profile: true } })
  if (status === "APPROVED") {
    const name = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email
    await sendEmail({ type: "investor-approved", name, email: user.email })
  }
  return NextResponse.json({ success: true })
}
