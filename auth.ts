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
import bcrypt from "bcryptjs"
import { createPool } from "mariadb"

// Direct mariadb connection — bypasses Prisma entirely for auth
const pool = createPool({
  host:     process.env.DB_HOST     ?? "172.28.0.2",
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.MYSQL_USER     ?? "alcazar_user",
  password: process.env.MYSQL_PASSWORD ?? "AlcazarDB2026x",
  database: process.env.MYSQL_DATABASE ?? "alcazar_portal",
  connectionLimit: 5,
})

async function findUserByEmail(email: string) {
  let conn
  try {
    conn = await pool.getConnection()
    const rows = await conn.query(
      `SELECT u.id, u.email, u.password, u.role, u.status,
              p.first_name, p.last_name
       FROM users u
       LEFT JOIN investor_profiles p ON p.user_id = u.id
       WHERE u.email = ?
       LIMIT 1`,
      [email]
    )
    return rows[0] ?? null
  } finally {
    if (conn) conn.release()
  }
}

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
          const user = await findUserByEmail(credentials.email as string)
          if (!user) {
            console.log("[auth] user not found:", credentials.email)
            return null
          }

          const valid = await bcrypt.compare(credentials.password as string, user.password)
          if (!valid) {
            console.log("[auth] invalid password for:", credentials.email)
            return null
          }

          if (user.status === "REJECTED") {
            console.log("[auth] user rejected:", credentials.email)
            return null
          }

          const name = user.first_name
            ? `${user.first_name} ${user.last_name}`
            : user.email

          console.log("[auth] login success:", user.email, user.role)

          return {
            id:     user.id,
            email:  user.email,
            role:   user.role,
            status: user.status,
            name,
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
