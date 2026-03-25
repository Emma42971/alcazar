import { prisma } from "@/lib/prisma"

/**
 * Verifies that a user has an active, non-revoked, non-expired AccessGrant
 * on the given project. Admins and super admins always pass.
 *
 * Returns null if access is granted.
 * Returns an error object with { error, status } if access is denied.
 */
export async function assertProjectAccess(
  userId: string,
  projectId: string,
  role: string
): Promise<{ error: string; status: number } | null> {
  // Admins bypass all project-level checks
  if (role === "ADMIN" || role === "SUPER_ADMIN") return null

  const grant = await prisma.accessGrant.findUnique({
    where: { userId_projectId: { userId, projectId } },
  })

  if (!grant) {
    return { error: "Access denied", status: 403 }
  }
  if (grant.revokedAt) {
    return { error: "Access has been revoked", status: 403 }
  }
  if (grant.expiresAt && new Date(grant.expiresAt) < new Date()) {
    return { error: "Access has expired", status: 403 }
  }

  return null
}
