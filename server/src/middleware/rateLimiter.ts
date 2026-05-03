import rateLimit from 'express-rate-limit'

const isProd = process.env.NODE_ENV === 'production'
const opts   = { validate: { xForwardedForHeader: false }, standardHeaders: true, legacyHeaders: false }

export const globalLimiter = rateLimit({
  ...opts,
  windowMs: 15 * 60 * 1000,
  max: isProd ? 300 : 1000,
  message: { error: 'عدد الطلبات تجاوز الحد المسموح. حاول مجدداً بعد قليل.' },
  skip: (req) => req.path === '/api/health',
})

export const authLimiter = rateLimit({
  ...opts,
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 100,
  skipSuccessfulRequests: true,
  message: { error: 'عدد محاولات تسجيل الدخول تجاوز الحد. حاول بعد 15 دقيقة.' },
})

export const writeLimiter = rateLimit({
  ...opts,
  windowMs: 60 * 1000,
  max: isProd ? 30 : 200,
  message: { error: 'عدد العمليات تجاوز الحد. حاول بعد دقيقة.' },
})

export const reportLimiter = rateLimit({
  ...opts,
  windowMs: 60 * 1000,
  max: isProd ? 20 : 200,
  message: { error: 'عدد طلبات التقارير تجاوز الحد.' },
})

// ── Platform public endpoints (ticket submission / tracking) ──────────────
export const platformPublicLimiter = rateLimit({
  ...opts,
  windowMs: 15 * 60 * 1000,
  max: isProd ? 30 : 300,   // 30 submissions per IP per 15min
  message: { error: 'عدد طلبات التذاكر تجاوز الحد المسموح. حاول مجدداً بعد 15 دقيقة.' },
})

// ── Ticket message limiter (prevent spam) ─────────────────────────────────
export const ticketMsgLimiter = rateLimit({
  ...opts,
  windowMs: 5 * 60 * 1000,
  max: isProd ? 10 : 100,
  message: { error: 'لا يمكنك إرسال أكثر من 10 رسائل كل 5 دقائق.' },
})
