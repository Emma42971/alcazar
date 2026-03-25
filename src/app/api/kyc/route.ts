export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join, extname } from "path"

const ALLOWED_EXTS  = [".pdf", ".jpg", ".jpeg", ".png"]
const ALLOWED_MIMES = ["application/pdf", "image/jpeg", "image/png"]
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json(null, { status: 401 })
    const kyc = await prisma.kycRecord.findUnique({ where: { userId: session.user.id } })
    return NextResponse.json(kyc)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({}, { status: 401 })

    const fd          = await req.formData()
    const idDoc       = fd.get("idDoc") as File | null
    const addressDoc  = fd.get("addressDoc") as File | null
    const idDocType   = fd.get("idDocType") as string | null

    // Validate each uploaded file
    function validateFile(file: File | null): string | null {
      if (!file) return null
      const ext = extname(file.name).toLowerCase()
      if (!ALLOWED_EXTS.includes(ext)) return `File type ${ext} not allowed`
      if (!ALLOWED_MIMES.includes(file.type)) return `MIME type ${file.type} not allowed`
      if (file.size > MAX_SIZE_BYTES) return `File exceeds 10 MB limit`
      return null
    }

    if (idDoc) {
      const err = validateFile(idDoc)
      if (err) return NextResponse.json({ error: err }, { status: 400 })
    }
    if (addressDoc) {
      const err = validateFile(addressDoc)
      if (err) return NextResponse.json({ error: err }, { status: 400 })
    }

    const uploadDir = join(process.env.UPLOAD_DIR ?? "/app/uploads", "kyc", session.user.id)
    await mkdir(uploadDir, { recursive: true })

    let idDocPath: string | null = null
    let addressDocPath: string | null = null

    if (idDoc) {
      const ext      = extname(idDoc.name).toLowerCase()
      const filename = `id_${Date.now()}${ext}`
      await writeFile(join(uploadDir, filename), Buffer.from(await idDoc.arrayBuffer()))
      idDocPath = `kyc/${session.user.id}/${filename}`
    }
    if (addressDoc) {
      const ext      = extname(addressDoc.name).toLowerCase()
      const filename = `address_${Date.now()}${ext}`
      await writeFile(join(uploadDir, filename), Buffer.from(await addressDoc.arrayBuffer()))
      addressDocPath = `kyc/${session.user.id}/${filename}`
    }

    const kyc = await prisma.kycRecord.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, status: "PENDING", idDocPath, idDocType, addressDocPath, submittedAt: new Date() },
      update: {
        status: "PENDING",
        ...(idDocPath    && { idDocPath }),
        ...(idDocType    && { idDocType }),
        ...(addressDocPath && { addressDocPath }),
        submittedAt: new Date(),
      }
    })
    return NextResponse.json(kyc)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
