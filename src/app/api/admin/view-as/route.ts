export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  await requireAdmin()
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      accessGrants: { include: { project: { select: { name: true, slug: true } } } },
      ndaRequests: { select: { projectId: true, status: true } },
    }
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const viewAs = {
    id: user.id, email: user.email, status: user.status,
    profile: user.profile,
    accessGrants: user.accessGrants.map(g => ({ projectId: g.projectId, projectName: g.project.name, projectSlug: g.project.slug, expiresAt: g.expiresAt })),
    ndaRequests: user.ndaRequests,
  }
  return NextResponse.json(viewAs)
}
