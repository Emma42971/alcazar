export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([])

  const requests = await prisma.eSignatureRequest.findMany({
    where: { recipientId: session.user.id },
    include: { document: { select: { name: true, fileType: true } }, project: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  })
  return NextResponse.json(requests.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    signedAt: r.signedAt?.toISOString() ?? null,
    expiresAt: r.expiresAt?.toISOString() ?? null,
  })))
}
