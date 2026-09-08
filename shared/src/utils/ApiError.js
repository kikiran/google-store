export class ApiError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code = 'BAD_REQUEST', message = 'Bad request', details) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(code = 'UNAUTHORIZED', message = 'Authentication required', details) {
    return new ApiError(401, code, message, details);
  }

  static forbidden(code = 'FORBIDDEN', message = 'You do not have permission to perform this action', details) {
    return new ApiError(403, code, message, details);
  }

  static notFound(code = 'NOT_FOUND', message = 'Resource not found', details) {
    return new ApiError(404, code, message, details);
  }

  static conflict(code = 'CONFLICT', message = 'Resource conflict', details) {
    return new ApiError(409, code, message, details);
  }

  static unprocessable(code = 'UNPROCESSABLE_ENTITY', message = 'Unprocessable request', details) {
    return new ApiError(422, code, message, details);
  }

  static tooManyRequests(code = 'TOO_MANY_REQUESTS', message = 'Rate limit exceeded', details) {
    return new ApiError(429, code, message, details);
  }

  static internal(code = 'INTERNAL_ERROR', message = 'Internal server error', details) {
    return new ApiError(500, code, message, details);
  }
}

export default ApiError;