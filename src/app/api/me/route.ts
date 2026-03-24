export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET() {
  try {
  const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { profile: true } })
    return NextResponse.json({ id: user?.id, email: user?.email, role: user?.role, profile: user?.profile })
  }
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}