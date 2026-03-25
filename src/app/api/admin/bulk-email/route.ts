export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com"

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { name, subject, body, segment, projectId } = await req.json()

  // Schema fields: subject, body, segment only — no name/projectId/status
  const campaign = await prisma.bulkEmailCampaign.create({
    data: { subject, body, segment: segment ?? "all" }
  })

  // Get target users
  const where: any = { role: "INVESTOR", status: "APPROVED" }
  if (segment === "with_access" && projectId) {
    where.accessGrants = { some: { projectId, revokedAt: null } }
  }
  const users = await prisma.user.findMany({
    where, include: { profile: { select: { firstName: true, lastName: true } } }, take: 500
  })

  let sentCount = 0
  for (const user of users) {
    try {
      const personalizedBody = body
        .replace(/\{\{firstName\}\}/g, user.profile?.firstName ?? "Investor")
        .replace(/\{\{lastName\}\}/g, user.profile?.lastName ?? "")
      await resend.emails.send({ from: FROM, to: user.email, subject, text: personalizedBody })
      sentCount++
    } catch {}
  }

  await prisma.bulkEmailCampaign.update({
    where: { id: campaign.id },
    data: { sentCount, sentAt: new Date() }
  })

  return NextResponse.json({ success: true, sentCount })
}
