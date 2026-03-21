export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { QuestionAnswerClient } from "./QuestionAnswerClient"
import { HelpCircle } from "lucide-react"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Q&A" }

export default async function QuestionsPage() {
  const questions = await prisma.projectQuestion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user:    { include: { profile: { select: { firstName: true, lastName: true } } } },
      project: { select: { name: true } },
    },
  })

  const unanswered = questions.filter(q => !q.answer)
  const answered   = questions.filter(q => !!q.answer)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Q&amp;A</h1>
          <p className="page-subtitle">{unanswered.length} unanswered · {answered.length} answered</p>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="card card-p text-center py-12">
          <HelpCircle className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(var(--text-muted))" }} />
          <p className="font-medium" style={{ color: "hsl(var(--text))" }}>No questions yet</p>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--text-subtle))" }}>
            Investor questions will appear here once they submit them.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {unanswered.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--text-muted))" }}>
                Awaiting Response
              </p>
              <div className="space-y-3">
                {unanswered.map(q => (
                  <QuestionAnswerClient key={q.id} question={{
                    id: q.id, question: q.question, answer: q.answer,
                    category: q.category, isShared: q.isShared,
                    createdAt: q.createdAt.toISOString(),
                    answeredAt: q.answeredAt?.toISOString() ?? null,
                    investorName: q.user.profile ? `${q.user.profile.firstName} ${q.user.profile.lastName}` : q.user.email,
                    projectName: q.project.name,
                  }} />
                ))}
              </div>
            </div>
          )}
          {answered.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 mt-6" style={{ color: "hsl(var(--text-muted))" }}>
                Answered
              </p>
              <div className="space-y-3">
                {answered.map(q => (
                  <QuestionAnswerClient key={q.id} question={{
                    id: q.id, question: q.question, answer: q.answer,
                    category: q.category, isShared: q.isShared,
                    createdAt: q.createdAt.toISOString(),
                    answeredAt: q.answeredAt?.toISOString() ?? null,
                    investorName: q.user.profile ? `${q.user.profile.firstName} ${q.user.profile.lastName}` : q.user.email,
                    projectName: q.project.name,
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
