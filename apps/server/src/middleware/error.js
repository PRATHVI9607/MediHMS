// Central error handler — turns DB/validation errors into friendly envelopes.
import { ApiError } from '../utils/http.js';

function mapDbError(err) {
  const msg = String(err.message || '');
  // Foreign-key violations (MySQL: ER_ROW_IS_REFERENCED / ER_NO_REFERENCED_ROW; SQLite: FOREIGN KEY)
  if (
    err.code === 'ER_ROW_IS_REFERENCED_2' ||
    err.code === 'ER_ROW_IS_REFERENCED' ||
    /foreign key/i.test(msg)
  ) {
    return new ApiError(
      409,
      'FK_CONSTRAINT',
      'This record is still referenced by other records and cannot be removed.',
      msg
    );
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return new ApiError(400, 'FK_MISSING', 'A referenced record does not exist.', msg);
  }
  // Unique constraint
  if (err.code === 'ER_DUP_ENTRY' || /unique constraint|duplicate/i.test(msg)) {
    return new ApiError(409, 'DUPLICATE', 'A record with this value already exists.', msg);
  }
  // Check constraint
  if (/check constraint|CHECK/i.test(msg) && err.code !== undefined) {
    return new ApiError(400, 'CHECK_FAILED', 'A field failed a validation constraint.', msg);
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let apiErr = err instanceof ApiError ? err : mapDbError(err);

  if (!apiErr) {
    console.error('Unhandled error:', err);
    apiErr = new ApiError(500, 'INTERNAL', 'Something went wrong on our end.');
  }

  res.status(apiErr.status).json({
    success: false,
    error: {
      code: apiErr.code,
      message: apiErr.message,
      ...(process.env.NODE_ENV !== 'production' && apiErr.detail
        ? { detail: apiErr.detail }
        : {}),
    },
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'ROUTE_NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` },
  });
}
