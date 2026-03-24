export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  // Get all projects this investor has access to
  const grants = await prisma.accessGrant.findMany({
    where: { userId: session.user.id, revokedAt: null },
    select: { projectId: true }
  })
  const projectIds = grants.map(g => g.projectId)

  const updates = await prisma.projectUpdate.findMany({
    where: { projectId: { in: projectIds }, isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { project: { select: { name: true, slug: true } } }
  })

  return NextResponse.json(updates.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  })))
}
