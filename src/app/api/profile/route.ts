export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { phone, companyName, country, city, jobTitle } = await req.json()
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
