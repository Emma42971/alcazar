/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    // Type errors now fail the build — fix progressively
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["bcryptjs", "pdf-lib", "@prisma/client", "@prisma/adapter-mariadb", "mariadb", "stripe"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-XSS-Protection",        value: "1; mode=block" },
          {
            key: "Content-Security-Policy",
            // 'unsafe-inline' required for Next.js inline scripts + styles
            // Tighten script-src progressively as nonces are adopted
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/api/stripe/webhook",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ]
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  experimental: {
    serverActions: { allowedOrigins: ["alc.e42.ca", "localhost:3000"] }
  },
}

export default nextConfig
