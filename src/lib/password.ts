const ITERATIONS = 100000
const KEY_LENGTH = 32
const SALT_LENGTH = 16

function bytesToBase64(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8,
  )
  const hash = new Uint8Array(derived)
  return `${bytesToBase64(salt)}:${bytesToBase64(hash)}`
}

async function pbkdf2Verify(password: string, stored: string): Promise<boolean> {
  try {
    const colon = stored.indexOf(':')
    const salt = base64ToBytes(stored.slice(0, colon))
    const expected = base64ToBytes(stored.slice(colon + 1))
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits'],
    )
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      KEY_LENGTH * 8,
    )
    const actual = new Uint8Array(derived)
    return actual.length === expected.length && actual.every((b, i) => b === expected[i])
  } catch {
    return false
  }
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.includes(':')) return pbkdf2Verify(password, stored)
  if (stored.startsWith('$2')) {
    try {
      const { default: bcrypt } = await import('bcryptjs')
      return bcrypt.compare(password, stored)
    } catch {
      return false
    }
  }
  return false
}
