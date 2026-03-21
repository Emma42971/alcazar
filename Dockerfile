FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl python3 make g++
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npm install --legacy-peer-deps || npm install --force || npm install
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
RUN mkdir -p public
RUN npx next build

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache git docker-cli
RUN git config --global --add safe.directory /docker/alcazar
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/pdf-lib ./node_modules/pdf-lib
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/mariadb ./node_modules/mariadb
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
