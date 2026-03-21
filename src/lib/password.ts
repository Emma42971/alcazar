// Argon2id — winner of Password Hashing Competition
// Much more resistant to GPU/ASIC attacks than bcrypt
// Falls back to bcrypt for backward compatibility

let argon2: any = null

async function getArgon2() {
  if (!argon2) {
    try {
      argon2 = await import("@node-rs/argon2")
    } catch {
      // Fallback to bcryptjs if argon2 not available
      return null
    }
  }
  return argon2
}

export async function hashPassword(password: string): Promise<string> {
  const a2 = await getArgon2()
  if (a2) {
    return a2.hash(password, {
      algorithm: 2,    // Argon2id
      memoryCost: 65536, // 64MB
      timeCost: 3,
      parallelism: 4,
    })
  }
  // Fallback
  const bcrypt = await import("bcryptjs")
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Detect hash type
  if (hash.startsWith("$argon2")) {
    const a2 = await getArgon2()
    if (a2) return a2.verify(hash, password)
  }
  // bcrypt fallback (for existing users)
  const bcrypt = await import("bcryptjs")
  return bcrypt.compare(password, hash)
}
