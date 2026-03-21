export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateNdaPdf } from "@/lib/nda-pdf"
import { sendAdminNdaSubmittedEmail } from "@/lib/email"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId, signerName, signatureType, signatureData } = await req.json()
  if (!projectId || !signerName) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

  // Générer le PDF NDA
  let pdfPath: string | null = null
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: { select: { firstName: true, lastName: true } } }
    })
    const fullName = user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : signerName

    const pdfBytes = await generateNdaPdf({
      ndaText: project.ndaText ?? "Standard Non-Disclosure Agreement",
      signerName: fullName,
      signerEmail: session.user.email ?? "",
      signerIp: ip,
      projectName: project.name,
      signatureType: signatureType ?? "typed",
      signatureData: signatureData ?? null,
      signedAt: new Date(),
    })

    const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads")
    const ndaDir = join(uploadDir, "ndas")
    await mkdir(ndaDir, { recursive: true })
    const filename = `nda_${session.user.id}_${projectId}_${Date.now()}.pdf`
    await writeFile(join(ndaDir, filename), pdfBytes)
    pdfPath = `/uploads/ndas/${filename}`
  } catch (e) {
    console.error("PDF generation error:", e)
  }

  // Créer ou mettre à jour la NDA request
  const existing = await prisma.ndaRequest.findFirst({
    where: { userId: session.user.id, projectId },
    orderBy: { createdAt: "desc" }
  })

  const ndaData = {
    signerFullName: signerName,
    signerIp: ip,
    signatureType: signatureType ?? "typed",
    signatureData: signatureData ?? null,
    signedAt: new Date(),
    signedPdfPath: pdfPath,
    status: "PENDING" as const,
  }

  let nda
  if (existing && existing.status === "REJECTED") {
    nda = await prisma.ndaRequest.create({ data: { userId: session.user.id, projectId, ...ndaData } })
  } else if (!existing) {
    nda = await prisma.ndaRequest.create({ data: { userId: session.user.id, projectId, ...ndaData } })
  } else {
    nda = await prisma.ndaRequest.update({ where: { id: existing.id }, data: ndaData })
  }

  // Notifier l'admin
  try {
    const profile = await prisma.investorProfile.findUnique({ where: { userId: session.user.id } })
    const name = profile ? `${profile.firstName} ${profile.lastName}` : session.user.email ?? "Unknown"
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) await sendAdminNdaSubmittedEmail(adminEmail, name, project.name)
  } catch (e) {
    console.error("Email error:", e)
  }

  return NextResponse.json({ success: true, id: nda.id })
}
