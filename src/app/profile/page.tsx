export const dynamic = "force-dynamic"
import { requireInvestor } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { InvestorHeader } from "@/components/investor/InvestorHeader"
import { ProfileClient } from "./ProfileClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "My Profile" }

export default async function ProfilePage() {
  const user = await requireInvestor()
  const profile = await prisma.investorProfile.findUnique({ where: { userId: user.id } })
  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      <InvestorHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <ProfileClient profile={profile ? JSON.parse(JSON.stringify(profile)) : null} email={user.email} />
      </main>
    </div>
  )
}
