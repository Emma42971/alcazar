import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import * as mariadb from "mariadb"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL!)

  // In Docker, hostname may be "db" or "localhost" — mariadb needs explicit host
  const host = url.hostname === "localhost" ? "db" : url.hostname

  const pool = mariadb.createPool({
    host,
    port:            parseInt(url.port) || 3306,
    user:            url.username,
    password:        decodeURIComponent(url.password),
    database:        url.pathname.slice(1),
    connectionLimit: 10,
    connectTimeout:  10000,
  })
  const adapter = new PrismaMariaDb(pool)
  return new PrismaClient({
    adapter,
    log:         process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    errorFormat: "minimal",
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
