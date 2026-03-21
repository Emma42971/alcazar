/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Next 16: Turbopack is now stable
  experimental: {
    turbo: {
      rules: {
        "*.svg": { loaders: ["@svgr/webpack"], as: "*.js" }
      }
    }
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
  },

  // Next 16: only external packages that need node APIs
  serverExternalPackages: ["bcryptjs", "pdf-lib", "@node-rs/argon2"],

  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control",  value: "on" },
          { key: "X-XSS-Protection",        value: "1; mode=block" },
          { key: "X-Frame-Options",         value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload"
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // needed for Next.js
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.anthropic.com",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; ")
          },
        ],
      },
    ]
  },
}
export default nextConfig
