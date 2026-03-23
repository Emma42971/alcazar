FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl python3 make g++
RUN npm install -g npm@latest
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npm install --legacy-peer-deps || npm install --force || npm install
RUN echo "import { defineConfig } from 'prisma/config'; export default defineConfig({ schema: './prisma/schema.prisma' });" > prisma.config.ts
RUN npx prisma generate

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV AUTH_SECRET=build_placeholder_secret_min_32_chars_xx
ENV AUTH_TRUST_HOST=true
ENV NEXTAUTH_URL=http://localhost:3000
ENV DATABASE_URL=mysql://root:root@localhost:3306/placeholder
ENV RESEND_API_KEY=placeholder
ENV RESEND_FROM_EMAIL=noreply@example.com
ENV ADMIN_EMAIL=admin@example.com
ENV UPLOAD_DIR=/app/uploads
ENV STRIPE_SECRET_KEY=placeholder
ENV STRIPE_WEBHOOK_SECRET=placeholder
RUN mkdir -p public
RUN npx next build

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache git docker-cli
RUN git config --global --add safe.directory /docker/alcazar

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer le répertoire uploads avec permissions ouvertes
# (Volume Docker monté par root — on reste root pour pouvoir écrire)
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/pdf-lib ./node_modules/pdf-lib
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/mariadb ./node_modules/mariadb

# Pas de USER nextjs — on reste root pour pouvoir écrire dans le volume uploads
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
