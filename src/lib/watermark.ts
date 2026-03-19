import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib"
import { readFile } from "fs/promises"
import { join } from "path"

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads")

/**
 * Lit un PDF depuis le disque, injecte un watermark diagonal sur chaque page,
 * et retourne le buffer watermarqué.
 */
export async function watermarkPdf(
  filePath: string,
  investorName: string,
  investorEmail: string
): Promise<Uint8Array> {
  // filePath est relatif : /uploads/projectId/filename.pdf
  const absolutePath = filePath.startsWith("/")
    ? join(UPLOAD_DIR, filePath.replace(/^\/uploads\//, ""))
    : filePath

  const fileBytes = await readFile(absolutePath)
  const pdfDoc    = await PDFDocument.load(fileBytes, { ignoreEncryption: true })
  const font      = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
  const pages     = pdfDoc.getPages()

  const watermarkText = `${investorName} | ${investorEmail} | Confidential`
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  const fullText = `${watermarkText} | ${date}`

  for (const page of pages) {
    const { width, height } = page.getSize()
    const fontSize = Math.min(14, width / 40)

    // Watermark diagonal au centre — semi-transparent
    page.drawText(fullText, {
      x: width * 0.05,
      y: height * 0.42,
      size: fontSize,
      font,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.25,
      rotate: degrees(35),
    })

    // Deuxième watermark plus bas pour couvrir
    page.drawText(fullText, {
      x: width * 0.05,
      y: height * 0.12,
      size: fontSize,
      font,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.2,
      rotate: degrees(35),
    })

    // Footer confidentiel discret
    page.drawText(`Confidential — ${investorEmail}`, {
      x: 30,
      y: 12,
      size: 7,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.5,
    })
  }

  return await pdfDoc.save()
}

/**
 * Génère un PDF de NDA signé avec pdf-lib.
 * Retourne le chemin où le fichier est sauvegardé.
 */
export async function generateNdaPdf(data: {
  projectId: string
  projectName: string
  ndaText: string
  signerName: string
  signerEmail: string
  signedAt: Date
  ipHash: string
}): Promise<string> {
  const pdfDoc = await PDFDocument.create()
  const font   = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const addPage = () => {
    const p = pdfDoc.addPage([595, 842]) // A4
    return p
  }

  // Page 1 — Header
  const page1 = addPage()
  const { width } = page1.getSize()

  page1.drawText("NON-DISCLOSURE AGREEMENT", {
    x: 50, y: 770, size: 18, font: bold, color: rgb(0, 0, 0),
  })
  page1.drawText(data.projectName, {
    x: 50, y: 748, size: 12, font, color: rgb(0.3, 0.3, 0.3),
  })

  // Metadata box
  page1.drawRectangle({ x: 50, y: 650, width: width - 100, height: 80, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 })
  const meta = [
    `Signer: ${data.signerName} <${data.signerEmail}>`,
    `Signed at: ${data.signedAt.toISOString()} UTC`,
    `IP hash (SHA-256): ${data.ipHash}`,
  ]
  meta.forEach((line, i) => {
    page1.drawText(line, { x: 60, y: 718 - i * 18, size: 9, font, color: rgb(0.2, 0.2, 0.2) })
  })

  // NDA text — wrap lines
  const ndaLines = wrapText(data.ndaText, 75)
  let y = 630
  for (const line of ndaLines) {
    if (y < 60) {
      const newPage = addPage()
      y = 800
      // redraw on new page using the page ref
      newPage.drawText(line, { x: 50, y, size: 10, font, color: rgb(0, 0, 0) })
    } else {
      page1.drawText(line, { x: 50, y, size: 10, font, color: rgb(0, 0, 0) })
    }
    y -= 15
  }

  // Signature block — last page
  const lastPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1)
  lastPage.drawLine({ start: { x: 50, y: 120 }, end: { x: 250, y: 120 }, thickness: 1, color: rgb(0, 0, 0) })
  lastPage.drawText(`Electronically signed by: ${data.signerName}`, { x: 50, y: 108, size: 10, font, color: rgb(0, 0, 0) })
  lastPage.drawText(`Date: ${data.signedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, { x: 50, y: 93, size: 10, font, color: rgb(0, 0, 0) })

  // Integrity footer
  const hash = require("crypto").createHash("sha256")
    .update(data.projectId + data.signerEmail + data.signedAt.toISOString())
    .digest("hex")
  lastPage.drawText(`Document integrity: SHA-256 ${hash}`, { x: 50, y: 40, size: 7, font, color: rgb(0.6, 0.6, 0.6) })

  const pdfBytes = await pdfDoc.save()

  // Sauvegarder
  const { writeFile, mkdir } = await import("fs/promises")
  const dir = join(UPLOAD_DIR, data.projectId, "ndas")
  await mkdir(dir, { recursive: true })
  const filename = `nda_${data.signerEmail.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.pdf`
  const outPath = join(dir, filename)
  await writeFile(outPath, pdfBytes)

  return `/uploads/${data.projectId}/ndas/${filename}`
}

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = []
  for (const para of text.split("\n")) {
    if (para.length <= maxChars) { lines.push(para); continue }
    const words = para.split(" ")
    let current = ""
    for (const word of words) {
      if ((current + " " + word).trim().length > maxChars) {
        if (current) lines.push(current)
        current = word
      } else {
        current = (current + " " + word).trim()
      }
    }
    if (current) lines.push(current)
  }
  return lines
}
