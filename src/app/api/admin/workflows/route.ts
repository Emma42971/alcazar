export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await requireAdmin()
  const rules = await prisma.workflowRule.findMany({
    include: { executions: { orderBy: { executedAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(rules)
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { name, trigger, action, actionData, projectId } = await req.json()
  const rule = await prisma.workflowRule.create({
    data: { name, trigger, action, actionData, projectId: projectId || null }
  })
  return NextResponse.json(rule)
}

export async function PATCH(req: NextRequest) {
  await requireAdmin()
  const { id, isActive } = await req.json()
  const rule = await prisma.workflowRule.update({ where: { id }, data: { isActive } })
  return NextResponse.json(rule)
}

export async function DELETE(req: NextRequest) {
  await requireAdmin()
  const { id } = await req.json()
  await prisma.workflowRule.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
