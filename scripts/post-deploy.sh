#!/bin/sh
set -e

echo "🔧 Post-deploy Alcazar..."

docker exec -u root alcazar_app npm install --prefix /app \
  prisma@7 @prisma/client@7 @prisma/adapter-mariadb \
  mariadb iconv-lite lru-cache@10 \
  get-port-please pathe zeptomatch remeda \
  valibot effect stripe slugify --no-save

docker exec -u root alcazar_app sh -c 'echo "import { defineConfig } from \"prisma/config\"; export default defineConfig({ datasource: { url: \"mysql://alcazar_user:AlcazarDB2026x@172.28.0.2:3306/alcazar_portal\" } });" > /app/prisma.config.ts'

docker exec -u root alcazar_app /app/node_modules/.bin/prisma db push --accept-data-loss

docker exec -u root alcazar_app node << 'JSEOF'
const bcrypt = require('bcryptjs');
bcrypt.hash('admin123456', 12).then(h => {
  const { createPool } = require('mariadb');
  const p = createPool({ host: '172.28.0.2', port: 3306, user: 'alcazar_user', password: 'AlcazarDB2026x', database: 'alcazar_portal' });
  p.getConnection().then(c => {
    c.query('INSERT INTO users (id,email,password,role,status,created_at,updated_at) VALUES (UUID(),?,?,"ADMIN","APPROVED",NOW(),NOW()) ON DUPLICATE KEY UPDATE password=?,status="APPROVED",role="ADMIN"',
    ['admin@alcazar.com', h, h])
    .then(() => { console.log('Admin OK'); process.exit(0); });
  });
});
JSEOF

docker network connect alcazar_alcazar_net npm 2>/dev/null || true

echo ""
echo "✅ Done! https://alc.e42.ca — admin@alcazar.com / admin123456"
