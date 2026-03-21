import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { sendNdaApprovedEmail } from "@/lib/email"

export async function runWorkflows(trigger: string, context: {
  userId?: string; projectId?: string; data?: any
}) {
  if (!context.projectId) return

  const rules = await prisma.workflowRule.findMany({
    where: { projectId: context.projectId, trigger: trigger as any, active: true }
  })

  for (const rule of rules) {
    try {
      await executeAction(rule, context)
      await prisma.workflowRule.update({
        where: { id: rule.id },
        data: { runCount: { increment: 1 }, lastRunAt: new Date() }
      })
      await prisma.workflowLog.create({
        data: { ruleId: rule.id, userId: context.userId, result: "success", details: JSON.stringify(context.data) }
      })
    } catch(e: any) {
      await prisma.workflowLog.create({
        data: { ruleId: rule.id, userId: context.userId, result: "error", details: e.message }
      })
    }
  }
}

async function executeAction(rule: any, context: { userId?: string; projectId?: string; data?: any }) {
  const { action, actionData, projectId } = rule
  const userId = context.userId

  if (action === "GRANT_ACCESS" && userId && projectId) {
    const days = actionData?.days
    const expiresAt = days ? new Date(Date.now() + days * 86400000) : null
    await prisma.accessGrant.upsert({
      where: { userId_projectId: { userId, projectId } },
      create: { userId, projectId, expiresAt },
      update: { revokedAt: null, expiresAt },
    })
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true } })
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })
    if (user && project) {
      await createNotification({
        userId, type: "ACCESS_GRANTED",
        title: `Access granted — ${project.name}`,
        body: "You now have access to the data room.",
        link: `/dashboard`
      })
    }
  }

  if (action === "SEND_EMAIL" && userId && actionData?.subject) {
    // Placeholder — extend with custom email sending
    console.log(`Workflow email to ${userId}: ${actionData.subject}`)
  }

  if (action === "SET_PIPELINE_STAGE" && userId && actionData?.stage) {
    await prisma.investorProfile.updateMany({
      where: { userId },
      data: { pipelineStage: actionData.stage }
    })
  }

  if (action === "CREATE_NOTE" && userId && actionData?.content) {
    await prisma.investorNote.create({
      data: { userId, content: `[AUTO] ${actionData.content}`, createdBy: "workflow" }
    })
  }

  if (action === "NOTIFY_ADMIN") {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
    for (const a of admins) {
      await createNotification({
        userId: a.id, type: "WORKFLOW_FIRED",
        title: `Workflow triggered: ${rule.name}`,
        body: JSON.stringify(context.data ?? {}).slice(0, 100),
        link: `/admin/investors`
      })
    }
  }
}
