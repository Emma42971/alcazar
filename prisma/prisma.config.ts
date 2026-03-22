import path from "node:path"
import { defineConfig } from "prisma/config"
import { createPool } from "mariadb"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

export default defineConfig({
  schema: path.join(__dirname, "schema.prisma"),
  migrate: {
    async adapter() {
      const pool = createPool({
        host:     process.env.DB_HOST     ?? "db",
        port:     parseInt(process.env.DB_PORT ?? "3306"),
        user:     process.env.MYSQL_USER     ?? "alcazar_user",
        password: process.env.MYSQL_PASSWORD ?? "AlcazarDB2026x",
        database: process.env.MYSQL_DATABASE ?? "alcazar_portal",
        connectionLimit: 5,
      })
      return new PrismaMariaDb(pool)
    }
  }
})
