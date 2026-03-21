export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import bcrypt from "bcryptjs"
import { sendWelcomeEmail, sendAdminNewInvestorEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password, firstName, lastName, phone, companyName, country, city, jobTitle, investorType, estTicket } = body

  if (!email || !password || !firstName || !lastName || !phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 })

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      email,
      password: hash,
      role: "INVESTOR",
      status: "PENDING_APPROVAL",
      profile: {
        create: {
          firstName, lastName, email, phone,
          companyName: companyName || null,
          country: country || null,
          city: city || null,
          jobTitle: jobTitle || null,
          investorType: investorType || null,
          estTicket: estTicket || null,
        }
      }
    }
  })

  // Emails
  try {
    await sendWelcomeEmail(email, firstName)
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      await sendAdminNewInvestorEmail(adminEmail, email, `${firstName} ${lastName}`)
    }
  } catch (e) {
    console.error("Email error:", e)
  }

  return NextResponse.json({ success: true, userId: user.id })
}
