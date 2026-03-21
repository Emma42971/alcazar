# Alcazar Investor Portal v3 — Deploy Guide

## Prerequisites
- VPS with Docker & Docker Compose (Hostinger VPS B or higher)
- Domain pointing to the VPS IP
- Git installed

## First deployment

```bash
# 1. Clone on the VPS
git clone <your-repo-url> alcazar-portal
cd alcazar-portal

# 2. Create environment file
cp .env.example .env
nano .env   # Fill in all values

# 3. Update Caddyfile with your domain
nano Caddyfile   # Replace investors.your-domain.com

# 4. Build and start
docker compose up -d --build

# 5. Run migrations + seed
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed

# 6. Verify
docker compose ps
docker compose logs app --tail 50
```

## Update (any subsequent version)

```bash
git pull
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

## Admin credentials (after seed)
- Email: admin@alcazar.com
- Password: admin123456
- ⚠️ Change password immediately in Admin → Team

## Environment variables
See .env.example for all required variables.
Key ones:
- AUTH_SECRET: Run `openssl rand -base64 32` to generate
- RESEND_API_KEY: Get from resend.com (free up to 3k/month)
- NEXTAUTH_URL: Your full domain with https://

## Useful commands
```bash
docker compose logs -f              # Live logs
docker compose exec app npx prisma studio   # DB GUI
docker compose down                 # Stop
docker compose restart app          # Restart app only
```
