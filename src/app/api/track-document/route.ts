export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import crypto from "crypto"
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { documentId, projectId, event, durationMs } = await req.json()
  if (!documentId || !projectId || !event) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  const ipHash = crypto.createHash("sha256").update(req.headers.get("x-forwarded-for") ?? "unknown").digest("hex")
  await prisma.documentActivity.create({ data: { documentId, userId: session.user.id, projectId, event, durationMs: durationMs ?? null, ipHash, userAgent: req.headers.get("user-agent") ?? "" } })
  if (event === "open") {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { notifyOnOpen: true, name: true } })
    if (project?.notifyOnOpen) {
      const count = await prisma.documentActivity.count({ where: { documentId, userId: session.user.id, event: "open" } })
      if (count === 1) {
        const [doc, profile] = await Promise.all([prisma.document.findUnique({ where: { id: documentId }, select: { name: true } }), prisma.investorProfile.findUnique({ where: { userId: session.user.id } })])
        const name = profile ? `${profile.firstName} ${profile.lastName}` : session.user.email!
        await sendEmail({ type: "first-document-open", investorName: name, docName: doc?.name ?? "a document", projectName: project.name })
      }
    }
  }
  return NextResponse.json({ success: true })
}
