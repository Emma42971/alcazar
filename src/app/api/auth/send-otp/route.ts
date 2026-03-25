export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { auth } from "@/auth"

const MAX_OTP_SENDS   = 3
const WINDOW_MINUTES  = 10

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Rate-limit OTP sends
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)
    const recentSends = await prisma.loginOtp.count({
      where: { userId: session.user.id, createdAt: { gt: windowStart } }
    })
    if (recentSends >= MAX_OTP_SENDS) {
      return NextResponse.json(
        { error: "Too many code requests. Please wait before requesting a new code." },
        { status: 429 }
      )
    }

    await prisma.loginOtp.updateMany({
      where: { userId: session.user.id, used: false },
      data: { used: true }
    })
    const code = String(Math.floor(100000 + Math.random() * 900000))
    await prisma.loginOtp.create({
      data: { userId: session.user.id, code, expiresAt: new Date(Date.now() + 600_000) }
    })
    await sendEmail({ type: "otp-code", email: session.user.email!, code })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
