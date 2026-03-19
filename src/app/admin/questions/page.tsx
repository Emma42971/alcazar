import { prisma } from "@/lib/prisma"
import { QuestionAnswerClient } from "./QuestionAnswerClient"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Q&A" }
export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project: filterProject } = await searchParams
  const questions = await prisma.projectQuestion.findMany({
    where: filterProject ? { projectId: filterProject } : {},
    include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } }, project: { select: { name: true, id: true } } },
    orderBy: { createdAt: "desc" },
  })
  const projects = await prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  const pending = questions.filter(q => !q.answer).length
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "'DM Serif Display',serif" }}>Q&A</h1>
          {pending > 0 && <span className="badge badge-pending text-xs">{pending} pending</span>}
        </div>
        {projects.length > 1 && (
          <form>
            <select name="project" defaultValue={filterProject ?? ""} onChange={e => { const url = new URL(window.location.href); if (e.target.value) url.searchParams.set("project", e.target.value); else url.searchParams.delete("project"); window.location.href = url.toString() }} className="rounded-lg px-3 py-1.5 text-sm" style={{ background: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 15%)", color: "hsl(0 0% 70%)", appearance: "auto" }}>
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </form>
        )}
      </div>
      <div className="space-y-4">
        {questions.length === 0 && <p className="text-sm" style={{ color: "hsl(0 0% 35%)" }}>No questions yet.</p>}
        {questions.map(q => {
          const name = q.user.profile ? `${q.user.profile.firstName} ${q.user.profile.lastName}` : q.user.email
          return (
            <div key={q.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(0 0% 11%)" }}>
              <div className="p-5" style={{ background: "hsl(0 0% 5.5%)" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div><p className="text-sm font-medium" style={{ color: "hsl(0 0% 85%)" }}>{name}</p><p className="text-xs" style={{ color: "hsl(0 0% 40%)" }}>{q.project.name} · {new Date(q.createdAt).toLocaleDateString()}</p></div>
                  <span className={`badge text-xs ${q.answer ? "badge-approved" : "badge-pending"}`}>{q.answer ? "Answered" : "Pending"}</span>
                </div>
                <p className="text-sm p-3 rounded-lg" style={{ background: "hsl(0 0% 4%)", color: "hsl(0 0% 70%)" }}>{q.question}</p>
                {q.answer && <div className="mt-3 p-3 rounded-lg border-l-2" style={{ background: "hsl(0 0% 4%)", borderColor: "hsl(142 71% 45% / 0.4)" }}><p className="text-xs mb-1" style={{ color: "hsl(0 0% 45%)" }}>Answer · {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString() : ""}</p><p className="text-sm" style={{ color: "hsl(0 0% 65%)" }}>{q.answer}</p></div>}
                {!q.answer && <QuestionAnswerClient questionId={q.id} />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
