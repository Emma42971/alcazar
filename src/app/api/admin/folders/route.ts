export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { projectId, name, parentId } = await req.json()
  if (!projectId || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  // Calculer l'index automatique
  const siblings = await prisma.documentFolder.findMany({
    where: { projectId, parentId: parentId ?? null },
    orderBy: { sortOrder: "asc" }
  })

  let index: string
  if (!parentId) {
    index = String(siblings.length + 1)
  } else {
    const parent = await prisma.documentFolder.findUnique({ where: { id: parentId } })
    index = `${parent?.index ?? "1"}.${siblings.length + 1}`
  }

  const folder = await prisma.documentFolder.create({
    data: { projectId, name, parentId: parentId ?? null, index, sortOrder: siblings.length }
  })
  return NextResponse.json(folder)
}

export async function GET(req: NextRequest) {
  await requireAdmin()
  const projectId = req.nextUrl.searchParams.get("projectId")
  if (!projectId) return NextResponse.json([], { status: 200 })
  const folders = await prisma.documentFolder.findMany({
    where: { projectId }, orderBy: [{ sortOrder: "asc" }, { index: "asc" }]
  })
  return NextResponse.json(folders)
}
