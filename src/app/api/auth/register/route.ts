export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { validate, registerSchema } from "@/lib/validators"
import { sendWelcomeEmail, sendAdminNewInvestorEmail } from "@/lib/email"
import { auditLog } from "@/lib/audit"
import { authLimiter } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  // Rate limit
  const limited = authLimiter(req)
  if (limited) return limited

  const body = await req.json()
  const result = validate(registerSchema, body)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 })

  const { email, password, firstName, lastName, phone, companyName, country, city, jobTitle, investorType, estTicket } = result.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 })

  const hash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email, password: hash, role: "INVESTOR", status: "PENDING_APPROVAL",
      profile: {
        create: {
          firstName, lastName, email, phone,
          companyName: companyName ?? null,
          country: country ?? null,
          city: city ?? null,
          jobTitle: jobTitle ?? null,
          investorType: investorType ?? null,
          estTicket: estTicket ?? null,
        }
      }
    }
  })

  await auditLog({
    action: "REGISTER", userId: user.id,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  })

  try {
    await sendWelcomeEmail(email, firstName)
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) await sendAdminNewInvestorEmail(adminEmail, email, `${firstName} ${lastName}`)
  } catch (e) { console.error("Email error:", e) }

  return NextResponse.json({ success: true, userId: user.id })
}
