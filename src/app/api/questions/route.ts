export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { projectId, question } = await req.json()
    if (!projectId || !question?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    const isAdmin = (session.user as any).role === "ADMIN"
    if (!isAdmin) {
      const grant = await prisma.accessGrant.findUnique({
        where: { userId_projectId: { userId: session.user.id, projectId } }
      })
      if (!grant || grant.revokedAt || (grant.expiresAt && new Date(grant.expiresAt) < new Date())) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }
    const q = await prisma.projectQuestion.create({
      data: { projectId, userId: session.user.id, question }
    })
    return NextResponse.json({ success: true, id: q.id })
  } catch (e: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
