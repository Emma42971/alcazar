export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { QuestionAnswerClient } from "./QuestionAnswerClient"
import Link from "next/link"
import { HelpCircle, Download } from "lucide-react"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Q&A" }

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ status?: string; project?: string }> }) {
  const { status: filterStatus, project: filterProject } = await searchParams
  const projects = await prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })

  const where: any = { parentId: null }
  if (filterStatus) where.status = filterStatus
  if (filterProject) where.projectId = filterProject

  const questions = await prisma.projectQuestion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user:       { include: { profile: { select: { firstName: true, lastName: true } } } },
      project:    { select: { name: true } },
      followUps:  { include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } } } },
      attachments: { select: { id: true, fileName: true, filePath: true } },
    },
  })

  const counts = { OPEN: 0, ANSWERED: 0, CLOSED: 0, REJECTED: 0 }
  questions.forEach(q => { counts[q.status as keyof typeof counts]++ })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Q&amp;A</h1>
          <p className="page-subtitle">{counts.OPEN} open · {counts.ANSWERED} answered · {questions.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/admin/qa-export" className="btn btn-secondary btn-sm">
            <Download className="h-3.5 w-3.5" />Export Excel
          </a>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: "All", value: "" },
          { label: `Open (${counts.OPEN})`, value: "OPEN" },
          { label: `Answered (${counts.ANSWERED})`, value: "ANSWERED" },
          { label: `Closed (${counts.CLOSED})`, value: "CLOSED" },
        ].map(f => (
          <Link key={f.value} href={`/admin/questions${f.value ? `?status=${f.value}` : ""}`}
            className={`btn btn-sm ${filterStatus === f.value || (!filterStatus && !f.value) ? "btn-primary" : "btn-secondary"}`}>
            {f.label}
          </Link>
        ))}
      </div>

      {questions.length === 0 ? (
        <div className="card card-p text-center py-12">
          <HelpCircle className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(var(--text-muted))" }} />
          <p className="font-medium">No questions yet</p>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--text-subtle))" }}>Investor questions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <QuestionAnswerClient key={q.id} question={{
              id: q.id, question: q.question, answer: q.answer,
              category: q.category, status: q.status, isShared: q.isShared,
              createdAt: q.createdAt.toISOString(),
              answeredAt: q.answeredAt?.toISOString() ?? null,
              investorName: q.user.profile ? `${q.user.profile.firstName} ${q.user.profile.lastName}` : q.user.email,
              projectName: q.project.name,
              followUps: q.followUps.map(fu => ({
                id: fu.id, question: fu.question, answer: fu.answer,
                investorName: fu.user.profile ? `${fu.user.profile.firstName} ${fu.user.profile.lastName}` : fu.user.email,
                createdAt: fu.createdAt.toISOString(),
              })),
              attachments: q.attachments,
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
