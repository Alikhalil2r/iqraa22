import rateLimit from 'express-rate-limit'

const isProd = process.env.NODE_ENV === 'production'

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'عدد الطلبات تجاوز الحد المسموح. حاول مجدداً بعد قليل.' },
  skip: (req) => req.path === '/api/health',
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: { xForwardedForHeader: false },
  message: { error: 'عدد محاولات تسجيل الدخول تجاوز الحد المسموح. حاول مجدداً بعد 15 دقيقة.' },
})

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'عدد العمليات تجاوز الحد المسموح. حاول مجدداً بعد دقيقة.' },
})

export const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'عدد طلبات التقارير تجاوز الحد المسموح.' },
})
