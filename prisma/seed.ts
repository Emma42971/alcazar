import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
const prisma = new PrismaClient()
async function main() {
  const hash = await bcrypt.hash("admin123456", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@alcazar.com" },
    update: {},
    create: { email: "admin@alcazar.com", password: hash, role: "ADMIN", status: "APPROVED" },
  })
  console.log("✅ Admin created:", admin.email)
  await prisma.project.upsert({
    where: { slug: "alcazar-fund-i" },
    update: {},
    create: {
      name: "Alcazar Fund I", slug: "alcazar-fund-i",
      summary: "A private equity fund focused on premium real estate assets in the UAE and GCC region.",
      status: "Open", isFeatured: true, teaserPublic: true, ndaRequired: true,
      minTicket: 250000, irrTargetBps: 1800, currency: "USD", targetRaise: BigInt(50_000_000),
      raisedAmount: BigInt(12_000_000), country: "UAE", sector: "Real Estate",
      expectedDuration: "5–7 years", riskLevel: "Medium",
      highlights: JSON.stringify(["Target IRR of 18% per annum", "Minimum investment: $250,000", "Quarterly distributions", "Regulated structure"]),
      publicMetrics: { irr: true, minTicket: true },
      ndaText: "CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT\n\nThis Agreement is entered into as of the date of signature below between Alcazar Capital and the undersigned party ('Recipient').\n\n1. CONFIDENTIAL INFORMATION\nRecipient acknowledges that all information, documents, data, and materials provided by Alcazar Capital are strictly confidential.\n\n2. NON-DISCLOSURE\nRecipient agrees not to disclose, reproduce, or distribute any Confidential Information without prior written consent.\n\n3. USE RESTRICTION\nConfidential Information shall be used solely for evaluating an investment in Alcazar Fund I.\n\n4. DURATION\nThis obligation survives for three (3) years from the date of signing.",
    },
  })
  console.log("✅ Sample project created")
}
main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1) })
