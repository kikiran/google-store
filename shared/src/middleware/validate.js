import { ApiError } from '../utils/ApiError.js';

/**
 * Validate request parts against a Zod schema.
 * Usage: validate({ body: schema, query: schema, params: schema })
 */
export function validate(schemas = {}) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (error) {
      const details = error.errors?.map((e) => ({
        path: e.path?.join('.'),
        message: e.message,
      }));
      next(ApiError.badRequest('VALIDATION_ERROR', 'Request validation failed', details));
    }
  };
}

export default validate;