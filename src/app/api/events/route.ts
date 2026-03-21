export const dynamic = "force-dynamic"
import { NextRequest } from "next/server"
import { auth } from "@/auth"

// Global event emitter map: userId -> set of controllers
const clients = new Map<string, Set<ReadableStreamDefaultController>>()

export function pushEvent(userId: string, event: object) {
  const userClients = clients.get(userId)
  if (!userClients) return
  const data = `data: ${JSON.stringify(event)}\n\n`
  userClients.forEach(ctrl => {
    try { ctrl.enqueue(new TextEncoder().encode(data)) } catch {}
  })
}

export function pushEventToAll(event: object) {
  const data = `data: ${JSON.stringify(event)}\n\n`
  clients.forEach(userClients => {
    userClients.forEach(ctrl => {
      try { ctrl.enqueue(new TextEncoder().encode(data)) } catch {}
    })
  })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const userId = session.user.id
  let controller: ReadableStreamDefaultController

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl
      if (!clients.has(userId)) clients.set(userId, new Set())
      clients.get(userId)!.add(ctrl)
      // Send initial ping
      ctrl.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "connected", userId })}\n\n`))
    },
    cancel() {
      clients.get(userId)?.delete(controller)
      if (clients.get(userId)?.size === 0) clients.delete(userId)
    }
  })

  // Keep-alive ping every 30s
  const pingInterval = setInterval(() => {
    try {
      controller.enqueue(new TextEncoder().encode(`: ping\n\n`))
    } catch {
      clearInterval(pingInterval)
    }
  }, 30000)

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    }
  })
}
