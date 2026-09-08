import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { middleware } from '@nova/shared';
import { attachIdentity, proxy } from './proxy.js';

const app = express();
const PORT = Number(process.env.PORT_GATEWAY || process.env.PORT || 8080);

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
    hsts: false,
  })
);

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// The gateway does NOT parse request bodies — it streams them verbatim to
// the owning service (parsing here would consume the stream).
app.use(cookieParser());

app.use(middleware.requestLogger);

// Very light global throttle; heavier throttling lives per service.
app.use('/api/auth', middleware.rateLimiter({ windowMs: 60_000, limit: 120 }));
app.use('/api', middleware.rateLimiter({ windowMs: 60_000, limit: 600 }));

app.use(attachIdentity);

app.get('/', (req, res) => {
  res.json({
    success: true,
    data: { name: 'Nova Store API', gateway: true, docs: '/api-docs' },
    message: 'Welcome to the Nova Store API Gateway',
  });
});

// Any route under /api is forwarded to the owning service.
app.all('/api/*', (req, res) => proxy(req, res));

app.use(middleware.notFoundHandler);
app.use(middleware.errorHandler);

app.listen(PORT, () => {
  console.log(`[api-gateway] listening on http://localhost:${PORT}`);
});