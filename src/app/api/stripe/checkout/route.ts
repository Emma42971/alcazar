export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { STRIPE_ENABLED, createCheckoutSession, PlanName } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  if (!STRIPE_ENABLED) {
    return NextResponse.json({ error: "Stripe is not enabled. Configure billing in Settings." }, { status: 503 })
  }
  const session = await requireAdmin()
  const { planName, tenantId } = await req.json()

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://alc.e42.ca"
  const checkout = await createCheckoutSession({
    tenantId, planName: planName as PlanName,
    email: session.email ?? "",
    successUrl: `${baseUrl}/admin/settings?tab=billing&success=1`,
    cancelUrl: `${baseUrl}/admin/settings?tab=billing&cancelled=1`,
  })
  return NextResponse.json({ url: checkout.url })
}
