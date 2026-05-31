// Standard response envelope + typed API error (PRD §8.3)

export class ApiError extends Error {
  constructor(status, code, message, detail) {
    super(message);
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export const notFound = (entity = 'Resource') =>
  new ApiError(404, 'NOT_FOUND', `${entity} not found.`);

export const ok = (res, data, meta) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.json(body);
};

export const created = (res, data) => res.status(201).json({ success: true, data });

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Parse ?page & ?limit into safe LIMIT/OFFSET values.
export const paginate = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
};
