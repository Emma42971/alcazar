export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { InquiryActionsClient } from "./InquiryActionsClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Inquiries" }
export default async function InquiriesPage() {
  const inquiries = await prisma.contactInquiry.findMany({
    include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } }, project: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
  const newCount = inquiries.filter(i => i.status === "NEW").length
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>Inquiries</h1>
        {newCount > 0 && <span className="badge badge-new text-xs">{newCount} new</span>}
      </div>
      <div className="space-y-4">
        {inquiries.length === 0 && <p className="text-sm" style={{ color: "hsl(0 0% 35%)" }}>No inquiries yet.</p>}
        {inquiries.map(inq => {
          const name = inq.user.profile ? `${inq.user.profile.firstName} ${inq.user.profile.lastName}` : inq.user.email
          return (
            <div key={inq.id} className="rounded-xl border p-5 space-y-3" style={{ background: "hsl(0 0% 5.5%)", borderColor: inq.status === "NEW" ? "hsl(217 91% 60% / 0.25)" : "hsl(0 0% 11%)" }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: "hsl(0 0% 88%)" }}>{name}</span>
                    <span className={`badge text-xs badge-${inq.status === "NEW" ? "new" : inq.status === "REPLIED" ? "approved" : "read"}`}>{inq.status}</span>
                    {inq.ticketSize && <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}>{inq.ticketSize}</span>}
                  </div>
                  <p className="text-xs" style={{ color: "hsl(0 0% 40%)" }}>{inq.project?.name ?? "General"} · {new Date(inq.createdAt).toLocaleDateString()}</p>
                </div>
                <a href={`mailto:${inq.user.email}`} className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}>Email</a>
              </div>
              {inq.message && <p className="text-sm" style={{ color: "hsl(0 0% 60%)" }}>{inq.message}</p>}
              <InquiryActionsClient inquiryId={inq.id} currentStatus={inq.status} adminNote={inq.adminNote} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
