export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { STRIPE_ENABLED, createPortalSession } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  if (!STRIPE_ENABLED) {
    return NextResponse.json({ error: "Stripe is not enabled." }, { status: 503 })
  }
  await requireAdmin()
  const { tenantId } = await req.json()
  const plan = await prisma.tenantPlan.findUnique({ where: { tenantId } })
  if (!plan?.stripeCustomerId) return NextResponse.json({ error: "No billing info" }, { status: 400 })

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://alc.e42.ca"
  const portal = await createPortalSession(plan.stripeCustomerId, `${baseUrl}/admin/settings?tab=billing`)
  return NextResponse.json({ url: portal.url })
}
