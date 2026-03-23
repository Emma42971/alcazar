import { z } from "zod"

// Auth
export const registerSchema = z.object({
  email:        z.string().email().max(255),
  password:     z.string().min(8).max(128).regex(/[A-Z]/, "Must contain uppercase").regex(/[0-9]/, "Must contain number"),
  firstName:    z.string().min(1).max(100).trim(),
  lastName:     z.string().min(1).max(100).trim(),
  phone:        z.string().min(5).max(30),
  companyName:  z.string().max(200).optional(),
  country:      z.string().max(100).optional(),
  city:         z.string().max(100).optional(),
  jobTitle:     z.string().max(200).optional(),
  investorType: z.string().max(100).optional(),
  estTicket:    z.string().max(50).optional(),
})

export const loginSchema = z.object({
  email:    z.string().email().max(255),
  password: z.string().min(1).max(128),
})

// Projects
export const projectSchema = z.object({
  name:            z.string().min(1).max(200).trim(),
  slug:            z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).trim(),
  summary:         z.string().max(500).optional(),
  description:     z.string().max(50000).optional(),
  country:         z.string().max(100).optional(),
  sector:          z.string().max(100).optional(),
  status:          z.enum(["Open", "Fundraising", "Goal Reached", "Closed", "Coming Soon"]).optional(),
  currency:        z.string().max(10).optional(),
  riskLevel:       z.string().max(50).optional(),
  targetRaise:     z.number().positive().optional(),
  minTicket:       z.number().positive().optional(),
  irrTargetBps:    z.number().min(0).max(100000).optional(),
})

// Chat
export const chatMessageSchema = z.object({
  projectId: z.string().cuid(),
  content:   z.string().min(1).max(5000).trim(),
})

// Q&A
export const questionSchema = z.object({
  projectId: z.string().cuid(),
  question:  z.string().min(1).max(2000).trim(),
  category:  z.enum(["GENERAL", "LEGAL", "FINANCIAL", "TECHNICAL"]).optional(),
})

// NDA
export const ndaSignSchema = z.object({
  projectId:     z.string().cuid(),
  signerName:    z.string().min(1).max(200).trim(),
  signatureType: z.enum(["canvas", "typed"]),
  signatureData: z.string().max(500000).optional(),
})

// KYC
export const kycReviewSchema = z.object({
  status:    z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().max(1000).optional(),
})

// Workflow
export const workflowSchema = z.object({
  name:       z.string().min(1).max(200).trim(),
  projectId:  z.string().cuid(),
  trigger:    z.enum(["NDA_SIGNED", "NDA_APPROVED", "INVESTOR_REGISTERED", "ACCESS_GRANTED", "KYC_APPROVED"]),
  action:     z.enum(["GRANT_ACCESS", "SEND_EMAIL", "SET_PIPELINE_STAGE", "CREATE_NOTE", "NOTIFY_ADMIN"]),
  actionData: z.record(z.any()).optional(),
  active:     z.boolean().optional(),
})

// Generic ID param
export const idSchema = z.object({ id: z.string().cuid() })

// Helper
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")
    return { error: errors }
  }
  return { data: result.data }
}
