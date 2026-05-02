import rateLimit from 'express-rate-limit'

// General API rate limiter
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 300,                   // Reduced from 500
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'عدد الطلبات تجاوز الحد المسموح. حاول مجدداً بعد قليل.' },
})

// Strict limiter for login endpoints — prevent brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // Reduced from 20 — only 10 failed attempts
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: { xForwardedForHeader: false },
  message: { error: 'عدد محاولات تسجيل الدخول تجاوز الحد المسموح. حاول مجدداً بعد 15 دقيقة.' },
})

// Stricter limiter for sensitive write operations
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'عدد العمليات تجاوز الحد المسموح. حاول مجدداً بعد دقيقة.' },
})
