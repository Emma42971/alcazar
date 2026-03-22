export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.email && !body.token) {
      const user = await prisma.user.findUnique({ where: { email: body.email } })
      if (user) {
        await prisma.passwordResetToken.updateMany({ where: { userId: user.id, used: false }, data: { used: true } })
        const token = crypto.randomBytes(32).toString("hex")
        await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt: new Date(Date.now() + 3600_000) } })
        await sendEmail({ type: "reset-password", email: user.email, token })
      }
      return NextResponse.json({ success: true })
    }
    if (body.token && body.password) {
      if (body.password.length < 8) return NextResponse.json({ error: "Password too short" }, { status: 400 })
      const rec = await prisma.passwordResetToken.findUnique({ where: { token: body.token } })
      if (!rec || rec.used || rec.expiresAt < new Date()) return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 })
      const hash = await bcrypt.hash(body.password, 12)
      await prisma.$transaction([
        prisma.user.update({ where: { id: rec.userId }, data: { password: hash } }),
        prisma.passwordResetToken.update({ where: { id: rec.id }, data: { used: true } }),
      ])
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
