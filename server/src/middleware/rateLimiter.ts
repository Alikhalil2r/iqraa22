import rateLimit from 'express-rate-limit'

const isProd = process.env.NODE_ENV === 'production'
const opts   = { validate: { xForwardedForHeader: false }, standardHeaders: true, legacyHeaders: false }

// ── Global limiter — all /api/* traffic ───────────────────────────────────────
export const globalLimiter = rateLimit({
  ...opts,
  windowMs: 15 * 60 * 1000,
  max: isProd ? 300 : 1000,
  message: { error: 'عدد الطلبات تجاوز الحد المسموح. حاول مجدداً بعد قليل.' },
  skip: (req) => req.path === '/api/health',
})

// ── Auth limiter — login attempts (skip on success to count only failures) ────
export const authLimiter = rateLimit({
  ...opts,
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 100,
  skipSuccessfulRequests: true,
  message: { error: 'عدد محاولات تسجيل الدخول تجاوز الحد. حاول بعد 15 دقيقة.' },
})

// ── Write limiter — POST/PUT/DELETE on sensitive data ─────────────────────────
export const writeLimiter = rateLimit({
  ...opts,
  windowMs: 60 * 1000,
  max: isProd ? 30 : 200,
  message: { error: 'عدد العمليات تجاوز الحد. حاول بعد دقيقة.' },
})

// ── Report limiter — heavy analytics/report queries ──────────────────────────
export const reportLimiter = rateLimit({
  ...opts,
  windowMs: 60 * 1000,
  max: isProd ? 20 : 200,
  message: { error: 'عدد طلبات التقارير تجاوز الحد.' },
})

// ── Platform public limiter — ticket submission ───────────────────────────────
export const platformPublicLimiter = rateLimit({
  ...opts,
  windowMs: 15 * 60 * 1000,
  max: isProd ? 30 : 300,
  message: { error: 'عدد طلبات التذاكر تجاوز الحد المسموح. حاول مجدداً بعد 15 دقيقة.' },
})

// ── Ticket message limiter — prevent chat spam ────────────────────────────────
export const ticketMsgLimiter = rateLimit({
  ...opts,
  windowMs: 5 * 60 * 1000,
  max: isProd ? 10 : 100,
  message: { error: 'لا يمكنك إرسال أكثر من 10 رسائل كل 5 دقائق.' },
})

// ── Ticket lookup limiter — prevent brute-force enumeration of ticket IDs ─────
export const ticketLookupLimiter = rateLimit({
  ...opts,
  windowMs: 10 * 60 * 1000,
  max: isProd ? 60 : 500,
  message: { error: 'عدد طلبات البحث عن التذاكر تجاوز الحد. حاول بعد 10 دقائق.' },
})

// ── Ticket rating limiter — 1 rating per ticket but limit spam ────────────────
export const ticketRateLimiter = rateLimit({
  ...opts,
  windowMs: 60 * 60 * 1000,
  max: isProd ? 20 : 200,
  message: { error: 'عدد التقييمات تجاوز الحد. حاول لاحقاً.' },
})
