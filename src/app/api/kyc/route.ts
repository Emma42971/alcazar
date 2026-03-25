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
    const docs = await prisma.kycDocument.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(docs)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({}, { status: 401 })

    const fd         = await req.formData()
    const idDoc      = fd.get("idDoc") as File | null
    const addressDoc = fd.get("addressDoc") as File | null
    const idDocType  = fd.get("idDocType") as string | null

    function validateFile(file: File | null): string | null {
      if (!file) return null
      const ext = extname(file.name).toLowerCase()
      if (!ALLOWED_EXTS.includes(ext)) return `File type ${ext} not allowed`
      if (!ALLOWED_MIMES.includes(file.type)) return `MIME type ${file.type} not allowed`
      if (file.size > MAX_SIZE_BYTES) return `File exceeds 10 MB limit`
      return null
    }

    const idErr = validateFile(idDoc)
    if (idErr) return NextResponse.json({ error: idErr }, { status: 400 })
    const addrErr = validateFile(addressDoc)
    if (addrErr) return NextResponse.json({ error: addrErr }, { status: 400 })

    const uploadDir = join(process.env.UPLOAD_DIR ?? "/app/uploads", "kyc", session.user.id)
    await mkdir(uploadDir, { recursive: true })

    const created: any[] = []

    if (idDoc) {
      const ext      = extname(idDoc.name).toLowerCase()
      const filename = `id_${Date.now()}${ext}`
      await writeFile(join(uploadDir, filename), Buffer.from(await idDoc.arrayBuffer()))
      const doc = await prisma.kycDocument.create({
        data: {
          userId:   session.user.id,
          docType:  idDocType ?? "ID_DOCUMENT",
          filePath: `kyc/${session.user.id}/${filename}`,
          fileName: idDoc.name,
          status:   "PENDING",
        }
      })
      created.push(doc)
    }

    if (addressDoc) {
      const ext      = extname(addressDoc.name).toLowerCase()
      const filename = `address_${Date.now()}${ext}`
      await writeFile(join(uploadDir, filename), Buffer.from(await addressDoc.arrayBuffer()))
      const doc = await prisma.kycDocument.create({
        data: {
          userId:   session.user.id,
          docType:  "PROOF_OF_ADDRESS",
          filePath: `kyc/${session.user.id}/${filename}`,
          fileName: addressDoc.name,
          status:   "PENDING",
        }
      })
      created.push(doc)
    }

    // Update profile KYC status
    await prisma.investorProfile.updateMany({
      where: { userId: session.user.id },
      data: { kycStatus: "PENDING" }
    })

    return NextResponse.json({ success: true, count: created.length })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
