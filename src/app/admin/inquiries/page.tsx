export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { InquiryActionsClient } from "./InquiryActionsClient"
import { MessageSquare } from "lucide-react"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Inquiries" }

export default async function InquiriesPage() {
  const inquiries = await prisma.contactInquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user:    { include: { profile: { select: { firstName: true, lastName: true } } } },
      project: { select: { name: true } },
    },
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inquiries</h1>
          <p className="page-subtitle">{inquiries.filter(i => i.status === "NEW").length} new · {inquiries.length} total</p>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="card card-p text-center py-12">
          <MessageSquare className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(var(--text-muted))" }} />
          <p className="font-medium" style={{ color: "hsl(var(--text))" }}>No inquiries yet</p>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--text-subtle))" }}>Investor inquiries will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map(inq => {
            const name = inq.user.profile ? `${inq.user.profile.firstName} ${inq.user.profile.lastName}` : inq.user.email
            return (
              <div key={inq.id} className="card card-p space-y-3"
                style={{ borderLeft: inq.status === "NEW" ? "3px solid hsl(var(--blue))" : "1px solid hsl(var(--border))" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{ background: "hsl(var(--accent-light))", color: "hsl(var(--accent))" }}>
                      {name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{name}</p>
                        {inq.project && <span className="text-xs" style={{ color: "hsl(var(--text-subtle))" }}>· {inq.project.name}</span>}
                        {inq.ticketSize && <span className="badge badge-blue">{inq.ticketSize}</span>}
                        <span className={`badge ${inq.status === "NEW" ? "badge-blue" : inq.status === "REPLIED" ? "badge-green" : "badge-gray"}`}>
                          {inq.status}
                        </span>
                      </div>
                      {inq.message && (
                        <p className="text-sm mt-1.5" style={{ color: "hsl(var(--text-subtle))" }}>{inq.message}</p>
                      )}
                      <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                        {new Date(inq.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </div>
                <InquiryActionsClient id={inq.id} adminNote={inq.adminNote} status={inq.status} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
