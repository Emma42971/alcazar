// Password hashing — Argon2id via @node-rs/argon2 (Node.js only, NOT Edge Runtime)
// This file must never be imported by middleware.ts

export async function hashPassword(password: string): Promise<string> {
  try {
    // @node-rs/argon2 — GPU-resistant, requires Node.js runtime
    const argon2 = await import("@node-rs/argon2")
    return argon2.hash(password, {
      algorithm: 2,      // Argon2id
      memoryCost: 65536, // 64MB
      timeCost: 3,
      parallelism: 4,
    })
  } catch {
    // Fallback to bcryptjs (also Node.js only)
    const bcrypt = await import("bcryptjs")
    return bcrypt.hash(password, 12)
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith("$argon2")) {
    try {
      const argon2 = await import("@node-rs/argon2")
      return argon2.verify(hash, password)
    } catch {}
  }
  // bcrypt fallback for existing users
  const bcrypt = await import("bcryptjs")
  return bcrypt.compare(password, hash)
}
