import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/", error: "/" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        otpVerified: {}, // flag passé après vérification OTP
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: { id: true, email: true, password: true, role: true, status: true },
        })
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null

        if (user.role === "INVESTOR" && user.status === "PENDING_APPROVAL") {
          throw new Error("PENDING")
        }
        if (user.role === "INVESTOR" && user.status === "REJECTED") {
          throw new Error("REJECTED")
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          // 2FA : si otpVerified n'est pas "true", on bloque en session temporaire
          needs2fa: credentials.otpVerified !== "true",
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id     = user.id
        token.role   = (user as any).role
        token.status = (user as any).status
        token.needs2fa = (user as any).needs2fa
      }
      return token
    },
    async session({ session, token }) {
      session.user.id     = token.id as string
      ;(session.user as any).role   = token.role
      ;(session.user as any).status = token.status
      ;(session.user as any).needs2fa = token.needs2fa
      return session
    },
  },
})
