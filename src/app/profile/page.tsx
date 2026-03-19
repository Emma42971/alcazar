import { requireInvestor } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { InvestorHeader } from "@/components/investor/InvestorHeader"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "My Profile" }
export default async function ProfilePage() {
  const user = await requireInvestor()
  const profile = await prisma.investorProfile.findUnique({ where: { userId: user.id } })
  return (
    <div className="min-h-screen" style={{ background: "hsl(0 0% 3.5%)" }}>
      <InvestorHeader />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <h1 className="text-2xl" style={{ fontFamily: "'DM Serif Display',serif" }}>My Profile</h1>
        <div className="rounded-xl border p-6 space-y-4" style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}>
          {[["Email", user.email], ["Name", profile ? `${profile.firstName} ${profile.lastName}` : "—"], ["Phone", profile?.phone ?? "—"], ["Company", profile?.companyName ?? "—"], ["Country", profile?.country ?? "—"], ["Investor Type", profile?.investorType ?? "—"], ["Est. Ticket", profile?.estTicket ?? "—"]].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-2 border-b" style={{ borderColor: "hsl(0 0% 10%)" }}>
              <span className="text-xs" style={{ color: "hsl(0 0% 45%)" }}>{k}</span>
              <span className="text-sm" style={{ color: "hsl(0 0% 80%)" }}>{v}</span>
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: "hsl(0 0% 35%)" }}>To update your profile information, please contact support.</p>
      </div>
    </div>
  )
}
