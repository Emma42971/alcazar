import { PrismaClient } from "@prisma/client"
import { PrismaMysql } from "@prisma/adapter-mysql"
import { createPool } from "mysql2/promise"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const pool = createPool(process.env.DATABASE_URL!)
  const adapter = new PrismaMysql(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    errorFormat: "minimal",
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
