export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json([], { status: 401 })
    const notifs = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json(notifs)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({}, { status: 401 })
    const { id, all } = await req.json()

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, readAt: null },
        data: { readAt: new Date() }
      })
      return NextResponse.json({ success: true })
    }

    if (id) {
      // updateMany enforces ownership — never update another user's notification
      const result = await prisma.notification.updateMany({
        where: { id, userId: session.user.id },
        data: { readAt: new Date() }
      })
      if (result.count === 0) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Missing id or all" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
