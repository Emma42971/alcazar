export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { projectId } = await req.json()
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
  await prisma.termsAcceptance.upsert({
    where: { userId_projectId: { userId: session.user.id, projectId } },
    create: { userId: session.user.id, projectId, ipAddress: ip },
    update: { acceptedAt: new Date(), ipAddress: ip },
  })
  return NextResponse.json({ success: true })
}
