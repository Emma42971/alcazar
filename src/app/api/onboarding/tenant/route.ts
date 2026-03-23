export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { STRIPE_ENABLED } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, slug, description, primaryColor, secondaryColor, tagline } = await req.json()
  if (!name || !slug) return NextResponse.json({ error: "Name and slug required" }, { status: 400 })

  const existing = await prisma.tenant.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ error: "Ce slug est déjà pris" }, { status: 409 })

  const tenant = await prisma.tenant.create({
    // If Stripe is disabled, activate immediately
    data: { name, slug, active: !STRIPE_ENABLED }
  })

  await prisma.tenantBranding.create({
    data: {
      tenantId: tenant.id,
      portalName: name,
      primaryColor: primaryColor ?? "#1a7a4a",
      secondaryColor: secondaryColor ?? "#1a2a4a",
      tagline: tagline ?? null,
    }
  })

  await prisma.tenantUsage.create({ data: { tenantId: tenant.id } })

  await prisma.tenantUser.create({
    data: { tenantId: tenant.id, userId: session.user.id, role: "admin" }
  })

  return NextResponse.json({
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    stripeEnabled: STRIPE_ENABLED, // tell frontend whether to show billing step
  })
}
