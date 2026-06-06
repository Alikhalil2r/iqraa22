const WEAK_JWT_SECRETS = [
  'secret',
  'changeme',
  'your-secret-key',
  'jwt_secret',
  'school',
  'password',
  '123456',
]

/** يتحقق من قوة JWT_SECRET عند بدء التشغيل */
export function assertJwtSecretStrength(): void {
  const secret = process.env.JWT_SECRET
  if (!secret) return

  if (secret.length < 32) {
    console.error('FATAL: JWT_SECRET must be at least 32 characters long.')
    process.exit(1)
  }

  const lower = secret.toLowerCase()
  const isWeak = WEAK_JWT_SECRETS.some((w) => lower === w || lower.includes(w))
  if (isWeak) {
    const msg = 'JWT_SECRET appears weak — use a random string of at least 32 characters.'
    if (process.env.NODE_ENV === 'production') {
      console.error(`FATAL: ${msg}`)
      process.exit(1)
    }
    console.warn(`WARNING: ${msg}`)
  }
}
