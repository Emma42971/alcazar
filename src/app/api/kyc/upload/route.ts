export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join, extname } from "path"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const fd = await req.formData()
  const file    = fd.get("file") as File | null
  const docType = fd.get("docType") as string | null

  if (!file || !docType) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const ext = extname(file.name).toLowerCase()
  const allowed = [".pdf", ".jpg", ".jpeg", ".png"]
  if (!allowed.includes(ext)) return NextResponse.json({ error: "File type not allowed" }, { status: 400 })

  const allowedMimes = ["application/pdf", "image/jpeg", "image/png"]
  if (!allowedMimes.includes(file.type)) {
    return NextResponse.json({ error: "MIME type not allowed" }, { status: 400 })
  }
  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 })
  }

  const uploadDir = join(process.env.UPLOAD_DIR ?? "/app/uploads", "kyc", session.user.id)
  await mkdir(uploadDir, { recursive: true })
  const filename = `${docType}_${Date.now()}${ext}`
  await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))

  const kycDoc = await prisma.kycDocument.create({
    data: {
      userId: session.user.id,
      docType,
      filePath: `kyc/${session.user.id}/${filename}`,
      fileName: file.name,
      status: "PENDING",
    }
  })

  // Update profile KYC status
  await prisma.investorProfile.updateMany({
    where: { userId: session.user.id },
    data: { kycStatus: "PENDING" }
  })

  return NextResponse.json({ success: true, id: kycDoc.id })
}
