export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, firstName, lastName, phone, companyName, country, city, jobTitle, investorType, estTicket } = body
    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (password.length < 8) return NextResponse.json({ error: "Password too short" }, { status: 400 })
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    const hash = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: {
        email, password: hash, role: "INVESTOR", status: "PENDING_APPROVAL",
        profile: { create: { firstName, lastName, email, phone, companyName, country, city, jobTitle, investorType, estTicket } },
      },
    })
    await sendEmail({ type: "investor-registered", name: `${firstName} ${lastName}`, email })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
