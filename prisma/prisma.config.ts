import path from "node:path"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: path.join(__dirname, "schema.prisma"),
  // DATABASE_URL lu depuis les env vars — compatible avec notre setup Docker
})
