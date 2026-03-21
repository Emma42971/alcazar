import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/password"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge:   8 * 60 * 60,    // 8 hours
    updateAge: 60 * 60,        // Refresh every 1 hour
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }
    }
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { profile: true },
        })
        if (!user) return null

        const valid = await verifyPassword(credentials.password as string, user.password)
        if (!valid) return null

        if (user.status === "REJECTED") return null

        return {
          id:     user.id,
          email:  user.email,
          role:   user.role,
          status: user.status,
          name:   user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id     = user.id
        token.role   = (user as any).role
        token.status = (user as any).status
      }
      // Refresh user data from DB on each token update
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, status: true }
        })
        if (dbUser) {
          token.role   = dbUser.role
          token.status = dbUser.status
        }
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
  pages: {
    signIn:  "/",
    signOut: "/",
    error:   "/",
  }
})
