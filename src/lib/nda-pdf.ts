import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib"

interface NdaPdfOptions {
  ndaText:        string
  signerName:     string
  signerEmail:    string
  signerIp:       string
  projectName:    string
  signatureType:  "canvas" | "typed"
  signatureData:  string | null // base64 PNG ou texte
  signedAt:       Date
}

export async function generateNdaPdf(opts: NdaPdfOptions): Promise<Uint8Array> {
  const doc    = await PDFDocument.create()
  const font   = await doc.embedFont(StandardFonts.Helvetica)
  const fontB  = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontOb = await doc.embedFont(StandardFonts.HelveticaOblique)
  const W = 595, H = 842

  // ── Page 1 : NDA text ──────────────────────────────────────
  const p1 = doc.addPage([W, H])
  const margin = 60
  const usable = W - 2 * margin

  // Header bar
  p1.drawRectangle({ x: 0, y: H - 70, width: W, height: 70, color: rgb(0.118, 0.227, 0.541) })
  p1.drawText("NON-DISCLOSURE AGREEMENT", { x: margin, y: H - 38, size: 16, font: fontB, color: rgb(1,1,1) })
  p1.drawText(opts.projectName, { x: margin, y: H - 58, size: 10, font, color: rgb(0.576, 0.761, 0.988) })

  // NDA Body — word wrap
  const lines = wrapText(opts.ndaText, font, 10, usable)
  let y = H - 100
  for (const line of lines) {
    if (y < 60) {
      const pg = doc.addPage([W, H])
      y = H - 60
      pg.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) })
    } else {
      p1.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) })
    }
    y -= 16
  }

  // ── Page 2 : Signature ─────────────────────────────────────
  const p2 = doc.addPage([W, H])
  p2.drawRectangle({ x: 0, y: H - 70, width: W, height: 70, color: rgb(0.118, 0.227, 0.541) })
  p2.drawText("SIGNATURE PAGE", { x: margin, y: H - 38, size: 16, font: fontB, color: rgb(1,1,1) })
  p2.drawText("Execution of this Non-Disclosure Agreement", { x: margin, y: H - 58, size: 10, font, color: rgb(0.576, 0.761, 0.988) })

  let sy = H - 110
  const row = (label: string, value: string) => {
    p2.drawText(label, { x: margin, y: sy, size: 9, font, color: rgb(0.5, 0.5, 0.5) })
    p2.drawText(value, { x: margin, y: sy - 14, size: 11, font: fontB, color: rgb(0.1, 0.1, 0.1) })
    sy -= 38
  }

  row("LEGAL NAME", opts.signerName)
  row("EMAIL ADDRESS", opts.signerEmail)
  row("DATE & TIME", opts.signedAt.toUTCString())
  row("IP ADDRESS", opts.signerIp)
  row("PROJECT", opts.projectName)

  // Signature box
  sy -= 10
  p2.drawRectangle({ x: margin, y: sy - 80, width: usable, height: 80, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 1, color: rgb(0.98, 0.99, 1) })
  p2.drawText("SIGNATURE", { x: margin + 10, y: sy - 14, size: 8, font, color: rgb(0.6, 0.6, 0.6) })

  if (opts.signatureType === "canvas" && opts.signatureData) {
    try {
      const base64 = opts.signatureData.replace(/^data:image\/\w+;base64,/, "")
      const img = await doc.embedPng(Buffer.from(base64, "base64"))
      p2.drawImage(img, { x: margin + 10, y: sy - 75, width: usable - 20, height: 60 })
    } catch { /* fallback to text */ }
  }

  if (opts.signatureType === "typed" || !opts.signatureData) {
    p2.drawText(opts.signerName, { x: margin + 20, y: sy - 50, size: 24, font: fontOb, color: rgb(0.1, 0.1, 0.8) })
  }

  sy -= 100
  p2.drawLine({ start: { x: margin, y: sy }, end: { x: margin + 220, y: sy }, thickness: 1, color: rgb(0.3, 0.3, 0.3) })
  p2.drawText("Authorized Signature", { x: margin, y: sy - 14, size: 9, font, color: rgb(0.5, 0.5, 0.5) })

  // Verification footer
  p2.drawRectangle({ x: margin, y: 40, width: usable, height: 36, color: rgb(0.96, 0.98, 1), borderColor: rgb(0.76, 0.86, 0.99), borderWidth: 1 })
  p2.drawText("✓ This document was electronically signed and is legally binding.", { x: margin + 10, y: 58, size: 8, font: fontB, color: rgb(0.118, 0.227, 0.541) })
  p2.drawText(`Document ID: ${generateDocId()}  ·  Signed: ${opts.signedAt.toISOString()}`, { x: margin + 10, y: 46, size: 7, font, color: rgb(0.5, 0.5, 0.5) })

  return doc.save()
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const result: string[] = []
  const paragraphs = text.split("\n")
  for (const para of paragraphs) {
    if (!para.trim()) { result.push(""); continue }
    const words = para.split(" ")
    let line = ""
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      const w = font.widthOfTextAtSize(test, size)
      if (w > maxWidth && line) { result.push(line); line = word }
      else line = test
    }
    if (line) result.push(line)
  }
  return result
}

function generateDocId(): string {
  return "NDA-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase()
}
