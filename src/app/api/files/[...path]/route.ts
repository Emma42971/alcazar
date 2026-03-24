export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { watermarkPdf } from "@/lib/watermark"
import { readFile } from "fs/promises"
import { join, resolve } from "path"
import { existsSync } from "fs"

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads")

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { path } = await params
  const [projectId, ...rest] = path
  const filename = rest.join("/")
  const isAdmin = (session.user as any).role === "ADMIN"
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

  // Path traversal protection
  const filePath = join(UPLOAD_DIR, projectId, filename)
  const realPath = resolve(filePath)
  if (!realPath.startsWith(resolve(UPLOAD_DIR))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }
  if (!existsSync(realPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  // Access control for non-admins
  if (!isAdmin) {
    const grant = await prisma.accessGrant.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId } }
    })

    // Must have grant, not revoked, not expired
    if (!grant) return NextResponse.json({ error: "Access denied" }, { status: 403 })
    if (grant.revokedAt) return NextResponse.json({ error: "Access revoked" }, { status: 403 })
    if (grant.expiresAt && new Date(grant.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Access expired" }, { status: 403 })
    }

    // Check document-level allowDownload
    const isDownload = req.nextUrl.searchParams.get("download") === "1"
    if (isDownload) {
      const doc = await prisma.document.findFirst({
        where: { projectId, filePath: { contains: filename } }
      })
      if (doc && !doc.allowDownload) {
        return NextResponse.json({ error: "Download not allowed for this document" }, { status: 403 })
      }
    }
  }

  const isPdf = filename.toLowerCase().endsWith(".pdf")
  const isDownload = req.nextUrl.searchParams.get("download") === "1"

  // Watermark ALL PDF access for investors (view AND download)
  if (isPdf && !isAdmin) {
    const profile = await prisma.investorProfile.findUnique({ where: { userId: session.user.id } })
    const name = profile ? `${profile.firstName} ${profile.lastName}` : session.user.email!
    try {
      const watermarked = await watermarkPdf(realPath, name, session.user.email!, ip)
      return new NextResponse(Buffer.from(watermarked), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${filename}"`,
          "Cache-Control": "private, no-store, no-cache",
          "X-Frame-Options": "SAMEORIGIN",
        },
      })
    } catch (e) {
      console.error("[files] watermark error:", e)
      // Fall through to serve original only if watermark fails — log it
    }
  }

  const buffer = await readFile(realPath)
  const ext = filename.split(".").pop()?.toLowerCase()
  const types: Record<string, string> = {
    pdf:  "application/pdf",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    png:  "image/png",
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": types[ext ?? ""] ?? "application/octet-stream",
      "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store, no-cache",
    },
  })
}
