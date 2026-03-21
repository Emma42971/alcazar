export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
export async function POST(req: NextRequest) {
  await requireAdmin()
  const { email, password } = await req.json()
  if (!email || !password || password.length < 8) return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 409 })
  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { email, password: hash, role: "ADMIN", status: "APPROVED" } })
  return NextResponse.json({ success: true, id: user.id })
}
