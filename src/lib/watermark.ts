import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib"
import { readFile } from "fs/promises"

interface WatermarkOptions {
  name:  string
  email: string
  ip?:   string
  date?: string
}

export async function watermarkPdf(filePath: string, name: string, email: string, ip?: string): Promise<Uint8Array> {
  const pdfBytes = await readFile(filePath)
  const doc  = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const font = await doc.embedFont(StandardFonts.Helvetica)

  const line1 = name
  const line2 = email
  const line3 = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  const line4 = ip ? `IP: ${ip}` : ""

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize()

    const positions = [
      { x: width * 0.1,  y: height * 0.72 },
      { x: width * 0.35, y: height * 0.45 },
      { x: width * 0.55, y: height * 0.20 },
    ]

    for (const pos of positions) {
      const base = { x: pos.x, y: pos.y, size: 9, font, color: rgb(0.65, 0.7, 0.82), opacity: 0.3, rotate: degrees(35) }
      page.drawText(line1, base)
      page.drawText(line2, { ...base, y: pos.y - 14 })
      page.drawText(line3, { ...base, y: pos.y - 28, size: 8 })
      if (line4) page.drawText(line4, { ...base, y: pos.y - 40, size: 7 })
    }
  }

  return doc.save()
}
