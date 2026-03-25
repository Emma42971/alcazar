export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join, extname } from "path"
import { sendNewDocumentEmail } from "@/lib/email"

const ALLOWED = [".pdf",".xlsx",".xls",".docx",".doc",".pptx",".ppt",".csv",".txt",".zip",".png",".jpg",".jpeg"]

export async function POST(req: NextRequest) {
  await requireAdmin()
  const fd = await req.formData()
  const file      = fd.get("file") as File | null
  const projectId = fd.get("projectId") as string | null
  const name      = fd.get("name") as string | null
  const folderId  = fd.get("folderId") as string | null
  const label     = (fd.get("label") as string | null) ?? "NONE"
  const status    = (fd.get("status") as string | null) ?? "PUBLISHED"
  const note      = (fd.get("note") as string | null) ?? null
  const versionOf = fd.get("versionOf") as string | null

  if (!file || !projectId || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const ext = extname(file.name).toLowerCase()
  if (!ALLOWED.includes(ext)) return NextResponse.json({ error: `File type ${ext} not allowed` }, { status: 400 })

  const MAX_SIZE = 50 * 1024 * 1024 // 50 MB for admin uploads
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 50 MB limit" }, { status: 400 })
  }

  const uploadDir = join(process.env.UPLOAD_DIR ?? "/app/uploads", projectId)
  await mkdir(uploadDir, { recursive: true })
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  const filepath = join(uploadDir, filename)
  await writeFile(filepath, Buffer.from(await file.arrayBuffer()))

  const fileType = ext.replace(".", "").toUpperCase()
  const relPath  = `${projectId}/${filename}`

  let doc
  if (versionOf) {
    const prev = await prisma.document.findUnique({ where: { id: versionOf } })
    if (prev) {
      await prisma.documentVersion.create({
        data: { documentId: versionOf, version: prev.version, filePath: prev.filePath, sizeBytes: prev.sizeBytes ?? 0, uploadedBy: "admin" }
      })
      doc = await prisma.document.update({
        where: { id: versionOf },
        data: { filePath: relPath, version: prev.version + 1, sizeBytes: file.size, label: label as any, status: status as any, internalNote: note }
      })
    }
  } else {
    doc = await prisma.document.create({
      data: {
        projectId, name, fileType, filePath: relPath, sizeBytes: file.size,
        folderId: folderId || null,
        label: label as any,
        status: status as any,
        internalNote: note,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      }
    })
  }

  // Notifier investisseurs si publié
  if (status === "PUBLISHED") {
    try {
      const grants = await prisma.accessGrant.findMany({
        where: { projectId, revokedAt: null },
        include: { user: { include: { profile: { select: { firstName: true } } } }, project: { select: { name: true } } }
      })
      for (const g of grants) {
        await sendNewDocumentEmail(g.user.email, g.user.profile?.firstName ?? "Investor", g.project.name, name)
      }
    } catch(e) { console.error("Email error:", e) }
  }

  return NextResponse.json({ success: true, id: doc?.id })
}
