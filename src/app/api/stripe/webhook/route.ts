export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { STRIPE_ENABLED, constructWebhookEvent, retrieveSubscription, PLANS } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  if (!STRIPE_ENABLED) {
    return NextResponse.json({ error: "Stripe is not enabled" }, { status: 503 })
  }

  const body = await req.text()
  const sig  = req.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: any
  try {
    event = await constructWebhookEvent(body, sig, webhookSecret)
  } catch (e: any) {
    return NextResponse.json({ error: `Webhook error: ${e.message}` }, { status: 400 })
  }

  // Idempotency check
  const existing = await prisma.stripeEvent.findUnique({ where: { stripeId: event.id } })
  if (existing?.processed) return NextResponse.json({ received: true })

  await prisma.stripeEvent.upsert({
    where: { stripeId: event.id },
    create: { stripeId: event.id, type: event.type, data: event.data },
    update: { type: event.type, data: event.data },
  })

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const { tenantId, planName } = session.metadata ?? {}
        if (!tenantId || !planName) break

        const sub = await retrieveSubscription(session.subscription)
        const plan = PLANS[planName as keyof typeof PLANS]

        await prisma.tenantPlan.upsert({
          where: { tenantId },
          create: {
            tenantId, name: planName as any, status: "ACTIVE",
            stripeCustomerId: session.customer,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0]?.price.id,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            maxProjects: plan.maxProjects,
            maxInvestors: plan.maxInvestors,
            maxStorageGb: plan.maxStorageGb,
          },
          update: {
            name: planName as any, status: "ACTIVE",
            stripeCustomerId: session.customer,
            stripeSubscriptionId: sub.id,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            maxProjects: plan.maxProjects,
            maxInvestors: plan.maxInvestors,
            maxStorageGb: plan.maxStorageGb,
          }
        })
        await prisma.tenant.update({ where: { id: tenantId }, data: { active: true } })
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object
        const tenantId = sub.metadata?.tenantId
        if (!tenantId) break
        const status = sub.status === "active" ? "ACTIVE"
          : sub.status === "past_due" ? "PAST_DUE"
          : sub.status === "canceled" ? "CANCELLED"
          : sub.status === "trialing" ? "TRIALING" : "INCOMPLETE"

        await prisma.tenantPlan.updateMany({
          where: { tenantId },
          data: { status: status as any, currentPeriodEnd: new Date(sub.current_period_end * 1000) }
        })
        if (status === "CANCELLED") {
          await prisma.tenant.update({ where: { id: tenantId }, data: { active: false } })
        }
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object
        const tenantId = sub.metadata?.tenantId
        if (!tenantId) break
        await prisma.tenantPlan.updateMany({ where: { tenantId }, data: { status: "CANCELLED", cancelledAt: new Date() } })
        await prisma.tenant.update({ where: { id: tenantId }, data: { active: false } })
        break
      }
    }

    await prisma.stripeEvent.update({
      where: { stripeId: event.id },
      data: { processed: true, processedAt: new Date() }
    })
  } catch (e: any) {
    await prisma.stripeEvent.update({ where: { stripeId: event.id }, data: { error: e.message } })
    console.error("Webhook error:", e)
  }

  return NextResponse.json({ received: true })
}
