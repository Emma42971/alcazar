import { prisma } from "@/lib/prisma"
import { cache } from "react"

export type TenantWithPlan = {
  id: string
  name: string
  slug: string
  domain: string | null
  active: boolean
  plan: {
    name: string
    status: string
    maxProjects: number
    maxInvestors: number
    maxStorageGb: number
    currentPeriodEnd: Date | null
  } | null
  branding: {
    primaryColor: string
    secondaryColor: string
    portalName: string
    logoUrl: string | null
    tagline: string | null
  } | null
}

// Resolve tenant from hostname or slug
export const getTenantByHost = cache(async (host: string): Promise<TenantWithPlan | null> => {
  const cleanHost = host.split(":")[0]

  // Check custom domain first
  const byDomain = await prisma.tenantDomain.findFirst({
    where: { domain: cleanHost, verified: true },
    select: { tenantId: true }
  })

  const tenantId = byDomain?.tenantId

  // Check slug subdomain (e.g., mycompany.alcazar.io)
  const slug = cleanHost.split(".")[0]

  const tenant = await prisma.tenant.findFirst({
    where: tenantId ? { id: tenantId } : { slug },
    include: {
      tenantPlan: true,
    }
  })

  if (!tenant || !tenant.active) return null

  // Get branding separately
  const branding = await prisma.tenantBranding.findUnique({
    where: { tenantId: tenant.id }
  })

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    domain: tenant.domain,
    active: tenant.active,
    plan: tenant.tenantPlan ? {
      name: tenant.tenantPlan.name,
      status: tenant.tenantPlan.status,
      maxProjects: tenant.tenantPlan.maxProjects,
      maxInvestors: tenant.tenantPlan.maxInvestors,
      maxStorageGb: tenant.tenantPlan.maxStorageGb,
      currentPeriodEnd: tenant.tenantPlan.currentPeriodEnd,
    } : null,
    branding: branding ? {
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      portalName: branding.portalName,
      logoUrl: branding.logoUrl,
      tagline: branding.tagline,
    } : null,
  }
})

export const getTenantBySlug = cache(async (slug: string): Promise<TenantWithPlan | null> => {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { tenantPlan: true }
  })
  if (!tenant || !tenant.active) return null

  const branding = await prisma.tenantBranding.findUnique({
    where: { tenantId: tenant.id }
  })

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    domain: tenant.domain,
    active: tenant.active,
    plan: tenant.tenantPlan ? {
      name: tenant.tenantPlan.name,
      status: tenant.tenantPlan.status,
      maxProjects: tenant.tenantPlan.maxProjects,
      maxInvestors: tenant.tenantPlan.maxInvestors,
      maxStorageGb: tenant.tenantPlan.maxStorageGb,
      currentPeriodEnd: tenant.tenantPlan.currentPeriodEnd,
    } : null,
    branding: branding ? {
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      portalName: branding.portalName,
      logoUrl: branding.logoUrl,
      tagline: branding.tagline,
    } : null,
  }
})

// Check if tenant is within plan limits
export async function checkTenantLimits(tenantId: string): Promise<{
  canAddProject: boolean
  canAddInvestor: boolean
  canAddStorage: boolean
  usage: { projects: number; investors: number; storageMb: number }
  limits: { maxProjects: number; maxInvestors: number; maxStorageGb: number }
}> {
  const [plan, usage] = await Promise.all([
    prisma.tenantPlan.findUnique({ where: { tenantId } }),
    prisma.tenantUsage.findUnique({ where: { tenantId } }),
  ])

  const limits = {
    maxProjects: plan?.maxProjects ?? 1,
    maxInvestors: plan?.maxInvestors ?? 10,
    maxStorageGb: plan?.maxStorageGb ?? 5,
  }

  const currentUsage = {
    projects: usage?.projectCount ?? 0,
    investors: usage?.investorCount ?? 0,
    storageMb: usage?.storageUsedMb ?? 0,
  }

  return {
    canAddProject: currentUsage.projects < limits.maxProjects,
    canAddInvestor: currentUsage.investors < limits.maxInvestors,
    canAddStorage: currentUsage.storageMb < limits.maxStorageGb * 1024,
    usage: currentUsage,
    limits,
  }
}

export async function updateTenantUsage(tenantId: string) {
  const [projectCount, investorCount] = await Promise.all([
    prisma.project.count({ where: { tenantId } }),
    prisma.accessGrant.count({
      where: { project: { tenantId }, revokedAt: null }
    }),
  ])

  await prisma.tenantUsage.upsert({
    where: { tenantId },
    create: { tenantId, projectCount, investorCount },
    update: { projectCount, investorCount, lastCalculated: new Date() },
  })
}
