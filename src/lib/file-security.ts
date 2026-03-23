// Magic bytes validation — check actual file content, not just extension
const MAGIC_BYTES: Record<string, number[][]> = {
  pdf:  [[0x25, 0x50, 0x44, 0x46]],                     // %PDF
  png:  [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG
  jpg:  [[0xFF, 0xD8, 0xFF]],                            // JPEG
  jpeg: [[0xFF, 0xD8, 0xFF]],
  gif:  [[0x47, 0x49, 0x46, 0x38]],                     // GIF8
  zip:  [[0x50, 0x4B, 0x03, 0x04]],                     // PK..
  xlsx: [[0x50, 0x4B, 0x03, 0x04]],                     // (xlsx is zip)
  xls:  [[0xD0, 0xCF, 0x11, 0xE0]],                     // Compound doc
  docx: [[0x50, 0x4B, 0x03, 0x04]],
  doc:  [[0xD0, 0xCF, 0x11, 0xE0]],
  pptx: [[0x50, 0x4B, 0x03, 0x04]],
}

export async function validateFileMagicBytes(file: File, extension: string): Promise<boolean> {
  const ext = extension.toLowerCase().replace(".", "")
  const expected = MAGIC_BYTES[ext]

  // If no magic bytes defined for this type, allow (txt, csv, etc.)
  if (!expected) return true

  // Read first 16 bytes
  const buffer = await file.slice(0, 16).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // Check if any magic byte pattern matches
  return expected.some(pattern =>
    pattern.every((byte, i) => bytes[i] === byte)
  )
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")  // Only safe chars
    .replace(/\.{2,}/g, ".")             // No double dots
    .replace(/^\.+/, "")                 // No leading dots
    .slice(0, 200)                       // Max length
}

export function validateFileSize(file: File, maxMB = 50): boolean {
  return file.size <= maxMB * 1024 * 1024
}

export const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".xlsx", ".xls", ".docx", ".doc",
  ".pptx", ".ppt", ".csv", ".txt", ".zip",
  ".png", ".jpg", ".jpeg",
])

export function isAllowedExtension(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."))
  return ALLOWED_EXTENSIONS.has(ext)
}
