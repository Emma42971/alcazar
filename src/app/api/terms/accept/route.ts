export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { assertProjectAccess } from "@/lib/access"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { projectId } = await req.json()
    if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 })

    // Must have access to the project before accepting legal terms for it
    const denied = await assertProjectAccess(session.user.id, projectId, (session.user as any).role)
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
    await prisma.termsAcceptance.upsert({
      where: { userId_projectId: { userId: session.user.id, projectId } },
      create: { userId: session.user.id, projectId, ipAddress: ip },
      update: { acceptedAt: new Date(), ipAddress: ip },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
