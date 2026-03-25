export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { assertProjectAccess } from "@/lib/access"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json([], { status: 401 })

    const projectId  = req.nextUrl.searchParams.get("projectId")
    const withUserId = req.nextUrl.searchParams.get("withUserId")
    if (!projectId || !withUserId) return NextResponse.json([])

    // Verify caller has access to this project
    const denied = await assertProjectAccess(session.user.id, projectId, (session.user as any).role)
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

    const messages = await prisma.chatMessage.findMany({
      where: {
        projectId,
        OR: [
          { senderId: session.user.id, receiverId: withUserId },
          { senderId: withUserId,      receiverId: session.user.id },
        ]
      },
      orderBy: { createdAt: "asc" },
      include: { sender: { include: { profile: { select: { firstName: true, lastName: true } } } } }
    })

    await prisma.chatMessage.updateMany({
      where: { projectId, senderId: withUserId, receiverId: session.user.id, readAt: null },
      data: { readAt: new Date() }
    })

    return NextResponse.json(messages.map(m => ({
      id: m.id, content: m.content, senderId: m.senderId,
      senderName: m.sender.profile
        ? `${m.sender.profile?.firstName} ${m.sender.profile?.lastName}`
        : m.sender.email,
      readAt: m.readAt, createdAt: m.createdAt.toISOString(),
      filePath: m.filePath, fileName: m.fileName,
    })))
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({}, { status: 401 })

    const { projectId, receiverId, content } = await req.json()
    if (!projectId || !receiverId || !content?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Verify caller has access to this project
    const denied = await assertProjectAccess(session.user.id, projectId, (session.user as any).role)
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

    const msg = await prisma.chatMessage.create({
      data: { projectId, senderId: session.user.id, receiverId, content },
      include: { sender: { include: { profile: { select: { firstName: true, lastName: true } } } } }
    })

    const senderName = msg.sender.profile
      ? `${msg.sender.profile?.firstName} ${msg.sender.profile?.lastName}`
      : msg.sender.email

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true, slug: true } })
    await createNotification({
      userId: receiverId,
      type: "NEW_MESSAGE",
      title: `New message from ${senderName}`,
      body: content.slice(0, 100),
      link: `/dashboard/${project?.slug ?? ""}`
    })

    return NextResponse.json({ success: true, id: msg.id })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
