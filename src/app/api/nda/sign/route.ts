export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateNdaPdf } from "@/lib/nda-pdf"
import { sendAdminNdaSubmittedEmail } from "@/lib/email"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { projectId, signerName, signatureType, signatureData } = await req.json()
    if (!projectId || !signerName?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    // Prevent signing if already APPROVED — no need to re-sign
    const existing = await prisma.ndaRequest.findFirst({
      where: { userId: session.user.id, projectId },
      orderBy: { createdAt: "desc" }
    })
    if (existing?.status === "APPROVED") {
      return NextResponse.json({ error: "NDA already approved" }, { status: 409 })
    }

    // Only INVESTOR role can sign NDAs — admins don't need to
    const role = (session.user as any).role
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Admins do not sign NDAs" }, { status: 403 })
    }

    // User must be approved before they can request NDA access
    if ((session.user as any).status !== "APPROVED") {
      return NextResponse.json({ error: "Account not yet approved" }, { status: 403 })
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

    let pdfPath: string | null = null
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: { select: { firstName: true, lastName: true } } }
      })
      const fullName = user?.profile
        ? `${user.profile?.firstName} ${user.profile?.lastName}`
        : signerName

      const pdfBytes = await generateNdaPdf({
        ndaText:       project.ndaText ?? "Standard Non-Disclosure Agreement",
        signerName:    fullName,
        signerEmail:   session.user.email ?? "",
        signerIp:      ip,
        projectName:   project.name,
        signatureType: signatureType ?? "typed",
        signatureData: signatureData ?? null,
        signedAt:      new Date(),
      })

      const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads")
      const ndaDir    = join(uploadDir, "ndas")
      await mkdir(ndaDir, { recursive: true })
      const filename = `nda_${session.user.id}_${projectId}_${Date.now()}.pdf`
      await writeFile(join(ndaDir, filename), pdfBytes)
      pdfPath = `ndas/${filename}`
    } catch (e) {
      console.error("[nda/sign] PDF generation error")
    }

    const ndaData = {
      signerFullName: signerName.trim(),
      signerIp:       ip,
      signatureType:  signatureType ?? "typed",
      signatureData:  signatureData ?? null,
      signedAt:       new Date(),
      signedPdfPath:  pdfPath,
      status:         "PENDING" as const,
    }

    let nda
    if (existing && existing.status === "REJECTED") {
      nda = await prisma.ndaRequest.create({ data: { userId: session.user.id, projectId, ...ndaData } })
    } else if (!existing) {
      nda = await prisma.ndaRequest.create({ data: { userId: session.user.id, projectId, ...ndaData } })
    } else {
      nda = await prisma.ndaRequest.update({ where: { id: existing.id }, data: ndaData })
    }

    try {
      const profile = await prisma.investorProfile.findUnique({ where: { userId: session.user.id } })
      const name = profile ? `${profile?.firstName} ${profile?.lastName}` : session.user.email ?? "Unknown"
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail) await sendAdminNdaSubmittedEmail(adminEmail, name, project.name)
    } catch {
      // Email failure must not block the NDA submission
    }

    return NextResponse.json({ success: true, id: nda.id })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
