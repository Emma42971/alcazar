import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib"

interface WatermarkOptions {
  name:      string
  email:     string
  ip?:       string
  date?:     string
}

export async function watermarkPdf(pdfBytes: Uint8Array, opts: WatermarkOptions): Promise<Uint8Array> {
  const doc  = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const font = await doc.embedFont(StandardFonts.Helvetica)

  const line1 = opts.name
  const line2 = opts.email
  const line3 = opts.date ?? new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize()

    // Diagonal watermark pattern — 3 répétitions en diagonale
    const positions = [
      { x: width * 0.15, y: height * 0.65 },
      { x: width * 0.35, y: height * 0.35 },
      { x: width * 0.55, y: height * 0.15 },
    ]

    for (const pos of positions) {
      const opts2 = {
        x: pos.x, y: pos.y,
        size: 9,
        font,
        color: rgb(0.7, 0.75, 0.85),
        opacity: 0.25,
        rotate: degrees(35),
      }
      page.drawText(line1, opts2)
      page.drawText(line2, { ...opts2, y: pos.y - 13 })
      page.drawText(line3, { ...opts2, y: pos.y - 26, size: 8 })
    }
  }

  return doc.save()
}
