export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const MAX_ATTEMPTS    = 5
const WINDOW_MINUTES  = 10

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 })

    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)

    // Count recent failed attempts (unused, non-expired OTPs tried in window)
    // We approximate: count all OTP lookups in the window using createdAt of failed records
    const recentAttempts = await prisma.loginOtp.count({
      where: {
        userId:    session.user.id,
        used:      false,
        createdAt: { gt: windowStart },
      }
    })

    if (recentAttempts > MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 }
      )
    }

    const otp = await prisma.loginOtp.findFirst({
      where: {
        userId:    session.user.id,
        code:      String(code).trim(),
        used:      false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    // Neutral error — don't reveal whether code or expiry is wrong
    if (!otp) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })

    await prisma.loginOtp.update({ where: { id: otp.id }, data: { used: true } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
