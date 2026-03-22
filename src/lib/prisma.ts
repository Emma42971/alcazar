import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { createPool } from "mariadb"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const pool = createPool({
    host:            process.env.DB_HOST ?? "172.28.0.2",
    port:            Number(process.env.DB_PORT) || 3306,
    user:            process.env.MYSQL_USER ?? "alcazar_user",
    password:        process.env.MYSQL_PASSWORD ?? "AlcazarDB2026x",
    database:        process.env.MYSQL_DATABASE ?? "alcazar_portal",
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
