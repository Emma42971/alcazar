import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { auth } from "@/auth"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await prisma.loginOtp.updateMany({ where: { userId: session.user.id, used: false }, data: { used: true } })
  const code = String(Math.floor(100000 + Math.random() * 900000))
  await prisma.loginOtp.create({ data: { userId: session.user.id, code, expiresAt: new Date(Date.now() + 600_000) } })
  await sendEmail({ type: "otp-code", email: session.user.email!, code })
  return NextResponse.json({ success: true })
}
