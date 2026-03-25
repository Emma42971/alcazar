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

// Required env vars — fail fast at startup if missing
// Required: DB_HOST, DB_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, AUTH_SECRET
const REQUIRED_ENVS = ["DB_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE", "AUTH_SECRET"] as const
for (const key of REQUIRED_ENVS) {
  if (!process.env[key]) throw new Error(`[auth] Missing required environment variable: ${key}`)
}

const pool = createPool({
  host:            process.env.DB_HOST!,
  port:            Number(process.env.DB_PORT ?? 3306),
  user:            process.env.MYSQL_USER!,
  password:        process.env.MYSQL_PASSWORD!,
  database:        process.env.MYSQL_DATABASE!,
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
          if (!user) return null

          const valid = await bcrypt.compare(credentials.password as string, user.password)
          if (!valid) return null
          if (user.status === "REJECTED") return null

          const name = user.first_name
            ? `${user.first_name} ${user.last_name}`
            : user.email

          return { id: user.id, email: user.email, role: user.role, status: user.status, name }
        } catch (e) {
          console.error("[auth] authorize error")
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
