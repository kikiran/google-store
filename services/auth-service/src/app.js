import express from 'express';
import helmet from 'helmet';
import { config, middleware } from '@nova/shared';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '128kb' }));
app.use(middleware.requestLogger);

app.get('/health', (req, res) => res.json({ success: true, data: { service: 'auth-service', status: 'ok' } }));
app.use('/api/auth', authRoutes);

app.use(middleware.notFoundHandler);
app.use(middleware.errorHandler);

export default app;