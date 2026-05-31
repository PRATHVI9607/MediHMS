import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';
import { ok, asyncHandler, ApiError } from '../utils/http.js';
import { validate } from '../middleware/validate.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get('SELECT * FROM APP_USER WHERE email = ?', [email.toLowerCase()]);
    if (!user) throw new ApiError(401, 'BAD_CREDENTIALS', 'Invalid email or password.');
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new ApiError(401, 'BAD_CREDENTIALS', 'Invalid email or password.');

    const token = signToken(user);
    ok(res, {
      token,
      user: { id: user.user_id, email: user.email, name: user.full_name, role: user.role },
    });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, {
      user: { id: req.user.sub, email: req.user.email, name: req.user.name, role: req.user.role },
    });
  })
);

export default router;
