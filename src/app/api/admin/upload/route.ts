export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads")
const ALLOWED_TYPES = ["application/pdf","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.presentationml.presentation","image/jpeg","image/png","image/webp"]
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  const fd = await req.formData()
  const file = fd.get("file") as File | null
  const projectId = fd.get("projectId") as string
  const name = fd.get("name") as string | null
  const type = fd.get("type") as string | null // "document" | "cover" | "logo" | "gallery"
  const versionOf = fd.get("versionOf") as string | null
  if (!file || !projectId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  const mime = file.type
  if (!ALLOWED_TYPES.includes(mime)) return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "File too large" }, { status: 400 })
  const ext = file.name.split(".").pop() ?? "bin"
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const dir = join(UPLOAD_DIR, projectId)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()))
  const filePath = `/uploads/${projectId}/${filename}`
  if (type === "document") {
    if (versionOf) {
      const old = await prisma.document.findUnique({ where: { id: versionOf } })
      if (old) {
        const newVersion = (old.version ?? 1) + 1
        const newDoc = await prisma.document.create({ data: { projectId, name: name ?? old.name, fileType: mime, filePath, sizeBytes: file.size, uploadedById: admin.id, version: newVersion } })
        await prisma.documentVersion.create({ data: { documentId: versionOf, version: old.version, filePath: old.filePath, sizeBytes: old.sizeBytes, uploadedBy: admin.id } })
        await prisma.document.update({ where: { id: versionOf }, data: { supersededBy: newDoc.id } })
        return NextResponse.json({ success: true, id: newDoc.id, version: newVersion })
      }
    }
    const doc = await prisma.document.create({ data: { projectId, name: name ?? file.name, fileType: mime, filePath, sizeBytes: file.size, uploadedById: admin.id } })
    return NextResponse.json({ success: true, id: doc.id, path: filePath })
  }
  return NextResponse.json({ success: true, path: filePath })
}
