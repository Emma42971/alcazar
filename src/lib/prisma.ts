import { PrismaClient } from "@prisma/client"
import { PrismaMariadb } from "@prisma/adapter-mariadb"
import mariadb from "mariadb"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  // Parse DATABASE_URL for mariadb connection
  const url = new URL(process.env.DATABASE_URL!)
  const pool = mariadb.createPool({
    host:     url.hostname,
    port:     parseInt(url.port) || 3306,
    user:     url.username,
    password: url.password,
    database: url.pathname.slice(1),
    connectionLimit: 10,
  })
  const adapter = new PrismaMariadb(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    errorFormat: "minimal",
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
