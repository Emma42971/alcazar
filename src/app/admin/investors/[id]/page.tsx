export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { InvestorDetailClient } from "./InvestorDetailClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Investor" }

export default async function InvestorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [user, projects, kycDocs, chatMessages] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        ndaRequests: {
          include: { project: { select: { name: true, id: true } } },
          orderBy: { createdAt: "desc" }
        },
        accessGrants: {
          include: { project: { select: { name: true, id: true } } },
          orderBy: { grantedAt: "desc" }
        },
        documentActivities: {
          include: {
            document: { select: { name: true } },
            project: { select: { name: true } }
          },
          orderBy: { viewedAt: "desc" },
          take: 50
        },
        projectQuestions: {
          include: { project: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20
        },
        kycDocuments: { orderBy: { createdAt: "desc" } },
        investorNotes: { orderBy: { createdAt: "desc" } },
        eSignRequests: {
          include: { document: { select: { name: true } }, project: { select: { name: true } } },
          orderBy: { createdAt: "desc" }
        },
      },
    }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.kycDocument.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" } }),
    prisma.chatMessage.findMany({
      where: { userId: id },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30
    })
  ])

  if (!user) notFound()

  return (
    <InvestorDetailClient
      user={JSON.parse(JSON.stringify(user))}
      projects={projects}
      chatMessages={JSON.parse(JSON.stringify(chatMessages))}
    />
  )
}
