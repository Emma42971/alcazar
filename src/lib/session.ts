import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export type SessionUser = {
  id: string
  email: string
  role: "ADMIN" | "INVESTOR"
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

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== "ADMIN") redirect("/dashboard")
  return user
}

export async function requireInvestor(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role === "ADMIN") redirect("/admin")
  if (user.status !== "APPROVED") redirect("/auth/pending")
  return user
}
