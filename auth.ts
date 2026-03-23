import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      status: string
    } & DefaultSession["user"]
  }
}

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: { profile: true },
          })
          if (!user) return null

          const valid = await bcrypt.compare(credentials.password as string, user.password)
          if (!valid) return null
          if (user.status === "REJECTED") return null

          return {
            id:     user.id,
            email:  user.email,
            role:   user.role,
            status: user.status,
            name:   user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email,
          }
        } catch (e) {
          console.error("[auth] authorize error:", e)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Only set on first sign in
      if (user) {
        token.id     = user.id
        token.role   = (user as any).role
        token.status = (user as any).status
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id     = token.id as string
        session.user.role   = token.role as string
        session.user.status = token.status as string
      }
      return session
    }
  },
  pages: { signIn: "/", signOut: "/", error: "/" }
})
