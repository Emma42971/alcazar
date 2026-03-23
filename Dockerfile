FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl python3 make g++
RUN npm install -g npm@latest
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npm install --legacy-peer-deps || npm install --force || npm install
# Tous les modules requis pour Prisma 7 + MariaDB
RUN npm install --no-save \
  prisma@7 @prisma/client@7 @prisma/adapter-mariadb \
  mariadb iconv-lite lru-cache@10 \
  get-port-please pathe zeptomatch remeda \
  valibot effect stripe slugify
RUN echo "import { defineConfig } from 'prisma/config'; export default defineConfig({ schema: './prisma/schema.prisma' });" > prisma.config.ts
RUN npx prisma generate

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV AUTH_SECRET=gZcNsHcQKPcQfdRFYBsYvyqgjAlv2YFU4AhIjon9tVg=
ENV AUTH_TRUST_HOST=true
ENV NEXTAUTH_URL=https://alc.e42.ca
ENV DATABASE_URL=mysql://alcazar_user:AlcazarDB2026x@172.28.0.2:3306/alcazar_portal
ENV DB_HOST=172.28.0.2
ENV MYSQL_USER=alcazar_user
ENV MYSQL_PASSWORD=AlcazarDB2026x
ENV MYSQL_DATABASE=alcazar_portal
ENV RESEND_API_KEY=placeholder
ENV RESEND_FROM_EMAIL=placeholder
ENV ADMIN_EMAIL=placeholder
ENV UPLOAD_DIR=/app/uploads
ENV STRIPE_SECRET_KEY=placeholder
ENV STRIPE_WEBHOOK_SECRET=placeholder
RUN mkdir -p public
RUN npx next build

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache git docker-cli
RUN git config --global --add safe.directory /docker/alcazar
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Copier TOUS les modules nécessaires au runtime
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=deps /app/node_modules/pdf-lib ./node_modules/pdf-lib
COPY --from=deps /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=deps /app/node_modules/mariadb ./node_modules/mariadb
COPY --from=deps /app/node_modules/iconv-lite ./node_modules/iconv-lite
COPY --from=deps /app/node_modules/lru-cache ./node_modules/lru-cache
COPY --from=deps /app/node_modules/get-port-please ./node_modules/get-port-please
COPY --from=deps /app/node_modules/pathe ./node_modules/pathe
COPY --from=deps /app/node_modules/zeptomatch ./node_modules/zeptomatch
COPY --from=deps /app/node_modules/remeda ./node_modules/remeda
COPY --from=deps /app/node_modules/valibot ./node_modules/valibot
COPY --from=deps /app/node_modules/effect ./node_modules/effect
COPY --from=deps /app/node_modules/stripe ./node_modules/stripe
COPY --from=deps /app/node_modules/slugify ./node_modules/slugify
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma

EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
