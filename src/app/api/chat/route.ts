export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { assertProjectAccess } from "@/lib/access"

// ChatMessage schema: id, projectId, userId, content, isAdmin, readAt, fileUrl, fileName, createdAt

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json([], { status: 401 })

    const projectId = req.nextUrl.searchParams.get("projectId")
    if (!projectId) return NextResponse.json([])

    const denied = await assertProjectAccess(session.user.id, projectId, (session.user as any).role)
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

    const messages = await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } } }
    })

    // Mark investor messages as read for admins, and vice versa
    const isAdmin = (session.user as any).role === "ADMIN" || (session.user as any).role === "SUPER_ADMIN"
    await prisma.chatMessage.updateMany({
      where: { projectId, isAdmin: !isAdmin, readAt: null },
      data: { readAt: new Date() }
    })

    return NextResponse.json(messages.map(m => ({
      id: m.id,
      content: m.content,
      userId: m.userId,
      isAdmin: m.isAdmin,
      senderName: m.user.profile
        ? `${m.user.profile?.firstName} ${m.user.profile?.lastName}`
        : m.user.email,
      readAt: m.readAt,
      createdAt: m.createdAt.toISOString(),
      fileUrl: m.fileUrl,
      fileName: m.fileName,
    })))
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({}, { status: 401 })

    const { projectId, content } = await req.json()
    if (!projectId || !content?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const denied = await assertProjectAccess(session.user.id, projectId, (session.user as any).role)
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

    const isAdmin = (session.user as any).role === "ADMIN" || (session.user as any).role === "SUPER_ADMIN"

    const msg = await prisma.chatMessage.create({
      data: { projectId, userId: session.user.id, content, isAdmin },
      include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } } }
    })

    const senderName = msg.user.profile
      ? `${msg.user.profile?.firstName} ${msg.user.profile?.lastName}`
      : msg.user.email

    // Notify the other party
    if (isAdmin) {
      // Find investors with access and notify them
      const grants = await prisma.accessGrant.findMany({
        where: { projectId, revokedAt: null },
        select: { userId: true }
      })
      for (const g of grants) {
        await createNotification({
          userId: g.userId,
          type: "NEW_MESSAGE",
          title: `New message from ${senderName}`,
          body: content.slice(0, 100),
          link: `/dashboard`
        })
      }
    }

    return NextResponse.json({ success: true, id: msg.id })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
