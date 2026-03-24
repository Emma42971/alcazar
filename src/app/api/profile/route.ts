export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest) {
  try {
  const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { phone, companyName, country, city, jobTitle } = await req.json()
    const exists = await prisma.investorProfile.findUnique({ where: { userId: session.user.id } })
  if (!exists) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const profile = await prisma.investorProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(phone !== undefined && { phone }),
        ...(companyName !== undefined && { companyName }),
        ...(country !== undefined && { country }),
        ...(city !== undefined && { city }),
        ...(jobTitle !== undefined && { jobTitle }),
      }
    })
    return NextResponse.json(profile)
  }
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}