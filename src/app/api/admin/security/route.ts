export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  await requireAdmin()
  const projectId = req.nextUrl.searchParams.get("projectId")
  if (!projectId) return NextResponse.json({})

  const config = await prisma.projectSecurityConfig.findUnique({ where: { projectId } })
  return NextResponse.json(config ?? {})
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const body = await req.json()
  const { projectId, ...data } = body

  const config = await prisma.projectSecurityConfig.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: { ...data, updatedAt: new Date() },
  })
  return NextResponse.json(config)
}
