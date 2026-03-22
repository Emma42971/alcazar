import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { createPool } from "mariadb"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const pool = createPool({
    host:            process.env.DB_HOST ?? "db",
    port:            parseInt(process.env.DB_PORT ?? "3306"),
    user:            process.env.DB_USER ?? "alcazar_user",
    password:        process.env.DB_PASSWORD ?? "AlcazarDB2026x",
    database:        process.env.DB_NAME ?? "alcazar_portal",
    connectionLimit: 10,
    connectTimeout:  10000,
    allowPublicKeyRetrieval: true,
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
