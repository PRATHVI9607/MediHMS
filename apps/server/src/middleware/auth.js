// JWT auth + role gating (PRD §9.1, §11)
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/http.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export const signToken = (user) =>
  jwt.sign(
    { sub: user.user_id, email: user.email, role: user.role, name: user.full_name },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required.'));
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    next(new ApiError(401, 'TOKEN_INVALID', 'Session expired or invalid. Please sign in again.'));
  }
}

// requireRole('Admin') or requireRole('Admin', 'Doctor')
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required.'));
  if (!roles.includes(req.user.role))
    return next(new ApiError(403, 'FORBIDDEN', `Requires role: ${roles.join(' or ')}.`));
  next();
};
