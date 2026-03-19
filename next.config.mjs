/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    unoptimized: false,
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs", "pdf-lib"],
}
export default nextConfig
