export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { join, resolve } from "path"
import { existsSync } from "fs"

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads")

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const role = (session.user as any).role
    const { id } = await params

    const nda = await prisma.ndaRequest.findUnique({
      where: { id },
      select: { signedPdfPath: true, userId: true }
    })

    if (!nda?.signedPdfPath) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 })
    }

    // Only allow: admin, super admin, or the investor who signed it
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"
    const isOwner = session.user.id === nda.userId
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Resolve path safely — prevent traversal
    const filePath = join(UPLOAD_DIR, nda.signedPdfPath)
    const realPath = resolve(filePath)
    if (!realPath.startsWith(resolve(UPLOAD_DIR))) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 })
    }
    if (!existsSync(realPath)) {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
    }

    const buffer = await readFile(realPath)
    const filename = nda.signedPdfPath.split("/").pop() ?? "nda.pdf"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control":       "private, no-store",
      }
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
