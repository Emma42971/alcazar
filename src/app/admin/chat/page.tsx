export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { AdminChatClient } from "./AdminChatClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Messages" }

export default async function AdminChatPage() {
  const [investors, projects] = await Promise.all([
    prisma.user.findMany({
      where: { role: "INVESTOR", status: "APPROVED" },
      include: { profile: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  ])
  const serialized = investors.map(i => ({
    id: i.id, email: i.email,
    name: i.profile ? `${i.profile?.firstName} ${i.profile?.lastName}` : i.email
  }))
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="page-header">
        <h1 className="page-title">Messages</h1>
      </div>
      <AdminChatClient investors={serialized} projects={projects} />
    </div>
  )
}
