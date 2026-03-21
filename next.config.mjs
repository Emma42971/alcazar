/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    unoptimized: false,
  },
  // NE PAS inclure @prisma/client ici — doit être bundlé normalement
  serverExternalPackages: ["bcryptjs", "pdf-lib"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}
export default nextConfig
