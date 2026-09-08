import { ApiError } from '../utils/ApiError.js';
import { fail } from '../utils/ApiResponse.js';
import { logger } from '../utils/logger.js';

/** Centralized error handler. Last middleware in every Express app. */
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    fail(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err.type === 'entity.parse.failed') {
    fail(res, 400, 'INVALID_JSON', 'Request body contains invalid JSON');
    return;
  }

  if (err.code === 'ER_DUP_ENTRY') {
    fail(res, 409, 'DUPLICATE_RESOURCE', 'A resource with the same unique value already exists');
    return;
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    fail(res, 422, 'INVALID_REFERENCE', 'Referenced resource does not exist');
    return;
  }

  logger.error({ err, method: req.method, url: req.originalUrl }, 'Unhandled error');
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  finish(res, { statusCode: 500, code: 'INTERNAL_ERROR', message });
  void next;
}

function finish(res, payload) {
  if (!res.headersSent) {
    fail(res, payload.statusCode, payload.code, payload.message);
  } else {
    res.end();
  }
}

/** 404 handler. */
export function notFoundHandler(req, res) {
  fail(res, 404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`);
}

export default errorHandler;