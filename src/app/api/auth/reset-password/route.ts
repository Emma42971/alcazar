export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const MAX_RESETS_PER_HOUR = 3

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Request reset link
    if (body.email && !body.token) {
      const user = await prisma.user.findUnique({ where: { email: body.email } })

      if (user) {
        // Rate-limit: max 3 reset requests per email per hour
        const hourAgo = new Date(Date.now() - 3600_000)
        const recentCount = await prisma.passwordResetToken.count({
          where: { userId: user.id, createdAt: { gt: hourAgo } }
        })

        if (recentCount >= MAX_RESETS_PER_HOUR) {
          // Return success anyway — don't reveal rate limiting to avoid enumeration
          return NextResponse.json({ success: true })
        }

        await prisma.passwordResetToken.updateMany({
          where: { userId: user.id, used: false },
          data: { used: true }
        })
        const token = crypto.randomBytes(32).toString("hex")
        await prisma.passwordResetToken.create({
          data: { userId: user.id, token, expiresAt: new Date(Date.now() + 3600_000) }
        })
        await sendEmail({ type: "reset-password", email: user.email, token })
      }

      // Always return success — don't reveal whether email exists
      return NextResponse.json({ success: true })
    }

    // Consume reset token and set new password
    if (body.token && body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: "Password too short" }, { status: 400 })
      }

      const rec = await prisma.passwordResetToken.findUnique({ where: { token: body.token } })
      if (!rec || rec.used || rec.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 })
      }

      const hash = await bcrypt.hash(body.password, 12)
      await prisma.$transaction([
        prisma.user.update({ where: { id: rec.userId }, data: { password: hash } }),
        prisma.passwordResetToken.update({ where: { id: rec.id }, data: { used: true } }),
      ])
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
