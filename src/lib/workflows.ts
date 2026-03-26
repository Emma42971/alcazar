import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { sendApprovalEmail } from "@/lib/email"

type TriggerType = "NDA_SIGNED" | "NDA_APPROVED" | "INVESTOR_REGISTERED" | "INVESTOR_APPROVED" | "DOCUMENT_OPENED" | "ACCESS_GRANTED"

export async function executeWorkflows(trigger: TriggerType, context: {
  userId?: string; projectId?: string; documentId?: string
}) {
  const rules = await prisma.workflowRule.findMany({
    where: {
      trigger,
      active: true,
      OR: [
        { projectId: context.projectId ?? undefined },
        { projectId: null },
      ]
    }
  })

  for (const rule of rules) {
    try {
      const data = rule.actionData as any ?? {}

      if (rule.action === "GRANT_ACCESS" && context.userId && context.projectId) {
        const expiresAt = data.daysValid
          ? new Date(Date.now() + data.daysValid * 86400000)
          : null
        await prisma.accessGrant.upsert({
          where: { userId_projectId: { userId: context.userId, projectId: context.projectId } },
          create: { userId: context.userId, projectId: context.projectId, expiresAt },
          update: { revokedAt: null, expiresAt },
        })
        await createNotification({
          userId: context.userId,
          type: "ACCESS_GRANTED",
          title: "Data Room Access Granted",
          body: "Your access has been automatically granted based on your NDA approval.",
          link: "/dashboard",
        })
      }

      if (rule.action === "NOTIFY_ADMIN" && context.userId) {
        const adminEmail = process.env.ADMIN_EMAIL
        if (adminEmail) {
          // Email to admin
        }
      }

      if (rule.action === "SET_PIPELINE_STAGE" && context.userId && data.stage) {
        await prisma.investorProfile.updateMany({
          where: { userId: context.userId },
          data: { pipelineStage: data.stage }
        })
      }

      await prisma.workflowLog.create({
        data: { ruleId: rule.id, userId: context.userId, result: "success", details: `Executed ${rule.action}` }
      })
    } catch(e: any) {
      await prisma.workflowLog.create({
        data: { ruleId: rule.id, userId: context.userId, result: "error", details: String(e) }
      })
    }
  }
}
