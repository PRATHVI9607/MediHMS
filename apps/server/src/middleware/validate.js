// Zod validation middleware — validates body / params / query.
import { ApiError } from '../utils/http.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || source}: ${i.message}`)
      .join('; ');
    return next(new ApiError(422, 'VALIDATION', issues));
  }
  req[source] = result.data;
  next();
};
