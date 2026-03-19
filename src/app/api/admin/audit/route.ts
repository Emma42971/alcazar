import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
export async function GET(req: NextRequest) {
  await requireAdmin()
  const projectId = req.nextUrl.searchParams.get("projectId") ?? ""
  const [activities, ndas, project] = await Promise.all([
    prisma.documentActivity.findMany({ where: { projectId }, orderBy: { viewedAt: "desc" }, take: 1000, include: { document: { select: { name: true } }, user: { include: { profile: { select: { firstName: true, lastName: true } } } } } }),
    prisma.ndaRequest.findMany({ where: { projectId }, include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } } } }),
    prisma.project.findUnique({ where: { id: projectId }, select: { name: true } }),
  ])
  return NextResponse.json({ project: project?.name, activities, ndas })
}
