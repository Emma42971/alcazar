import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { InvestorDetailClient } from "./InvestorDetailClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Investor Detail" }

export default async function InvestorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      ndaRequests: { include: { project: { select: { name: true, id: true } } }, orderBy: { createdAt: "desc" } },
      accessGrants: { include: { project: { select: { name: true, id: true } } } },
      documentActivities: { include: { document: { select: { name: true } }, project: { select: { name: true } } }, orderBy: { viewedAt: "desc" }, take: 20 },
    },
  })
  if (!user) notFound()
  const projects = await prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  return <InvestorDetailClient user={JSON.parse(JSON.stringify(user))} projects={projects} />
}
