// Rate limiters (PRD §9.2 — SQL console capped at 30 req/min/user)
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

export const queryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.sub?.toString() || req.ip,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Too many queries. Limit is 30 per minute.' },
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Too many login attempts. Try again later.' },
  },
});
