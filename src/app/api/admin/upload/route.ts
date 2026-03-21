export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads")

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/msword",
  "application/vnd.ms-powerpoint",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()

  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file      = fd.get("file") as File | null
  const projectId = fd.get("projectId") as string | null
  const name      = fd.get("name") as string | null
  const type      = fd.get("type") as string | null
  const versionOf = fd.get("versionOf") as string | null

  // Validation
  if (!file)      return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (!projectId) return NextResponse.json({ error: "No project ID provided" }, { status: 400 })

  // Type check — be lenient, allow unknown types for common extensions
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
  const mime = file.type || "application/octet-stream"
  const allowedExts = ["pdf","xlsx","xls","docx","doc","pptx","ppt","jpg","jpeg","png","webp","gif"]
  
  if (!ALLOWED_TYPES.includes(mime) && !allowedExts.includes(ext)) {
    return NextResponse.json({ error: `File type not allowed: ${mime} (.${ext})` }, { status: 400 })
  }

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 })
  }

  // Save file
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const dir = join(UPLOAD_DIR, projectId)

  try {
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()))
  } catch (err: any) {
    console.error("File write error:", err)
    return NextResponse.json({ error: "Failed to save file: " + err.message }, { status: 500 })
  }

  const filePath = `/uploads/${projectId}/${filename}`

  // Create document record
  if (type === "document") {
    try {
      if (versionOf) {
        const old = await prisma.document.findUnique({ where: { id: versionOf } })
        if (old) {
          const newVersion = (old.version ?? 1) + 1
          const newDoc = await prisma.document.create({
            data: {
              projectId,
              name: name ?? old.name,
              fileType: mime,
              filePath,
              sizeBytes: file.size,
              uploadedById: admin.id,
              version: newVersion,
            },
          })
          await prisma.documentVersion.create({
            data: {
              documentId: versionOf,
              version: old.version,
              filePath: old.filePath,
              sizeBytes: old.sizeBytes,
              uploadedBy: admin.id,
            },
          })
          await prisma.document.update({
            where: { id: versionOf },
            data: { supersededBy: newDoc.id },
          })
          return NextResponse.json({ success: true, id: newDoc.id, version: newVersion, path: filePath })
        }
      }

      const doc = await prisma.document.create({
        data: {
          projectId,
          name: name ?? file.name,
          fileType: mime,
          filePath,
          sizeBytes: file.size,
          uploadedById: admin.id,
        },
      })
      return NextResponse.json({ success: true, id: doc.id, path: filePath })
    } catch (err: any) {
      console.error("Document DB error:", err)
      return NextResponse.json({ error: "DB error: " + err.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, path: filePath })
}
