export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { watermarkPdf } from "@/lib/watermark"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads")

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { path } = await params
  const [projectId, ...rest] = path
  const filename = rest.join("/")

  // Check access
  if ((session.user as any).role !== "ADMIN") {
    const access = await prisma.accessGrant.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId } },
    })
    if (!access) return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const filePath = join(UPLOAD_DIR, projectId, filename)
  const realPath = require("path").resolve(filePath)
  if (!realPath.startsWith(UPLOAD_DIR) || !existsSync(realPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const isPdf = filename.toLowerCase().endsWith(".pdf")
  const isDownload = req.nextUrl.searchParams.get("download") === "1"

  // Watermark pour les PDFs (pas en download admin)
  if (isPdf && !isDownload && (session.user as any).role !== "ADMIN") {
    const profile = await prisma.investorProfile.findUnique({ where: { userId: session.user.id } })
    const name = profile ? `${profile.firstName} ${profile.lastName}` : session.user.email!
    try {
      const watermarked = await watermarkPdf(
        `/uploads/${projectId}/${filename}`,
        name,
        session.user.email!
      )
      return new NextResponse(Buffer.from(watermarked), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "private, no-store",
        },
      })
    } catch {}
  }

  const buffer = await readFile(realPath)
  const ext = filename.split(".").pop()?.toLowerCase()
  const types: Record<string, string> = {
    pdf: "application/pdf",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": types[ext ?? ""] ?? "application/octet-stream",
      "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
