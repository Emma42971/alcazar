/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["bcryptjs", "pdf-lib", "@prisma/client", "@prisma/adapter-mariadb", "mariadb", "stripe"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-XSS-Protection",          value: "1; mode=block" },
        ],
      },
      {
        // No cache for Stripe webhook
        source: "/api/stripe/webhook",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ],
  },

  experimental: {
    serverActions: { allowedOrigins: ["alc.e42.ca", "localhost:3000"] }
  },
}

export default nextConfig
