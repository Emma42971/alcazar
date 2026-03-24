export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({})
    const { documentId, pageNumber, durationMs } = await req.json()
    if (!documentId || !pageNumber) return NextResponse.json({})
    await prisma.documentHeatmap.upsert({
      where: { documentId_userId_pageNumber: { documentId, userId: session.user.id, pageNumber } },
      create: { documentId, userId: session.user.id, pageNumber, durationMs, viewCount: 1 },
      update: { durationMs: { increment: durationMs }, viewCount: { increment: 1 } }
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json([])
    const documentId = req.nextUrl.searchParams.get("documentId")
    if (!documentId) return NextResponse.json([])
    const data = await prisma.documentHeatmap.groupBy({
      by: ["pageNumber"],
      where: { documentId },
      _sum: { durationMs: true, viewCount: true },
      orderBy: { pageNumber: "asc" }
    })
    return NextResponse.json(data.map(d => ({
      page: d.pageNumber,
      totalMs: d._sum.durationMs ?? 0,
      views: d._sum.viewCount ?? 0,
    })))
  } catch (e: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
