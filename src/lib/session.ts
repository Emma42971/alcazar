import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export type SessionUser = {
  id: string
  email: string
  role: "ADMIN" | "SUPER_ADMIN" | "INVESTOR"
  status: string
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user as SessionUser
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/")
  return user
}

// Accepts both ADMIN and SUPER_ADMIN — consistent with middleware
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") redirect("/dashboard")
  return user
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== "SUPER_ADMIN") redirect("/admin")
  return user
}

export async function requireInvestor(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") redirect("/admin")
  if (user.status !== "APPROVED") redirect("/auth/pending")
  return user
}
