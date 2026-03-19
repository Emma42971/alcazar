import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { projectId, ticketSize, message } = await req.json()
  await prisma.contactInquiry.create({ data: { userId: session.user.id, projectId: projectId ?? null, ticketSize, message, status: "NEW" } })
  const [profile, project] = await Promise.all([prisma.investorProfile.findUnique({ where: { userId: session.user.id } }), projectId ? prisma.project.findUnique({ where: { id: projectId }, select: { name: true } }) : null])
  const name = profile ? `${profile.firstName} ${profile.lastName}` : session.user.email!
  await sendEmail({ type: "new-inquiry", name, email: session.user.email!, project: project?.name ?? "General", message, ticket: ticketSize })
  return NextResponse.json({ success: true })
}
