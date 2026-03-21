export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { code } = await req.json()
  const otp = await prisma.loginOtp.findFirst({
    where: { userId: session.user.id, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  })
  if (!otp) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
  await prisma.loginOtp.update({ where: { id: otp.id }, data: { used: true } })
  return NextResponse.json({ success: true })
}
