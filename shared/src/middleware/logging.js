import { logger } from '../utils/logger.js';

/** Structured request logging. */
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ms: Math.round(ms * 10) / 10,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }, 'request');
  });
  next();
}

export default requestLogger;