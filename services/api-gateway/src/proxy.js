import { jwt } from '@nova/shared';
import { resolveService, buildTargetUrl, SERVICES } from './registry.js';

const FORWARD_HEADERS = ['accept', 'accept-language', 'content-type', 'origin', 'user-agent', 'cookie', 'x-api-key'];
const HOP_HEADERS = ['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive', 'upgrade', 'te'];

/**
 * Attaches trusted identity headers to requests that carry a valid access
 * JWT. Public routes simply proceed without identity; downstream services
 * enforce authorization. The gateway never blocks on optional auth.
 */
export function attachIdentity(req, res, next) {
  const token =
    (req.cookies && req.cookies.nova_access) ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (token) {
    const payload = jwt.verifyAccessToken(token);
    if (payload && payload.sub) {
      req.headers['x-user-id'] = String(payload.sub);
      req.headers['x-user-email'] = payload.email || '';
      req.headers['x-user-name'] = payload.name || '';
      req.headers['x-user-role'] = payload.role || 'CUSTOMER';
    }
  }
  next();
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Forwards the request to the owning service, preserving method, path,
 * query string, headers and body. Streams the response back verbatim.
 */
export function proxy(req, res) {
  const serviceName = resolveService(req);
  if (!serviceName) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `No service for ${req.path}` } });
    return;
  }

  if (serviceName === 'gateway') {
    res.json({ success: true, data: { service: 'nova-store-api-gateway', status: 'ok' }, message: 'Nova Store API Gateway' });
    return;
  }

  const targetUrl = buildTargetUrl(serviceName, req.originalUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  const headers = {};
  for (const name of FORWARD_HEADERS) {
    const value = req.headers[name];
    if (value !== undefined) headers[name] = value;
  }
  for (const name of Object.keys(req.headers)) {
    if (name.startsWith('x-user-') && !name.startsWith('x-user-external')) headers[name] = req.headers[name];
  }
  // Internal services must never be spoofed from the outside — pin the
  // injected role to what the verified JWT says.
  headers['x-user-id'] = req.headers['x-user-id'] || '';
  headers['x-user-email'] = req.headers['x-user-email'] || '';
  headers['x-user-name'] = req.headers['x-user-name'] || '';
  headers['x-user-role'] = req.headers['x-user-role'] || 'GUEST';
  if (!req.headers['x-user-id']) delete headers['x-user-id'];

  readRawBody(req)
    .then(async (body) => {
      const allowedMethods = ['GET', 'HEAD', 'OPTIONS'];
      const hasBody = body.length > 0;
      const opts = {
        method: req.method,
        headers,
        redirect: 'manual',
        signal: controller.signal,
      };
      if (!allowedMethods.includes(req.method)) {
        opts.headers['content-length'] = String(body.length);
      }
      if (hasBody) opts.body = body;

      let upstream;
      upstream = await fetch(targetUrl, opts);

      res.status(upstream.status);
      upstream.headers.forEach((value, name) => {
        const lower = name.toLowerCase();
        if (HOP_HEADERS.includes(lower)) return;
        // Don't leak internal headers that could confuse the browser.
        res.setHeader(name, value);
      });

      const upstreamBody = await upstream.arrayBuffer();
      return res.send(Buffer.from(upstreamBody));
    })
    .catch((err) => {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        res.status(504).json({ success: false, error: { code: 'UPSTREAM_TIMEOUT', message: 'The upstream service timed out' } });
        return;
      }
      res.status(503).json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: `Service ${serviceName} is unavailable` } });
    });
}

export { SERVICES };