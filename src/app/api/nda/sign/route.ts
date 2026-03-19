import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { generateNdaPdf } from "@/lib/watermark"
import crypto from "crypto"
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { projectId, signerName } = await req.json()
  if (!projectId || !signerName) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  const existing = await prisma.ndaRequest.findFirst({ where: { userId: session.user.id, projectId } })
  if (existing) return NextResponse.json({ error: "Already submitted" }, { status: 409 })
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })
  const ipHash = crypto.createHash("sha256").update(req.headers.get("x-forwarded-for") ?? "unknown").digest("hex")
  const now = new Date()
  let pdfPath: string | null = null
  try { pdfPath = await generateNdaPdf({ projectId, projectName: project.name, ndaText: project.ndaText ?? "", signerName, signerEmail: session.user.email!, signedAt: now, ipHash }) } catch {}
  const nda = await prisma.ndaRequest.create({ data: { userId: session.user.id, projectId, status: "PENDING", signerFullName: signerName, signerIpHash: ipHash, signedAt: now, signedPdfPath: pdfPath } })
  const profile = await prisma.investorProfile.findUnique({ where: { userId: session.user.id } })
  const name = profile ? `${profile.firstName} ${profile.lastName}` : signerName
  await sendEmail({ type: "nda-signed", name, email: session.user.email!, project: project.name })
  return NextResponse.json({ success: true, ndaId: nda.id })
}
