import express from 'express';
import helmet from 'helmet';
import { middleware } from '@nova/shared';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '128kb' }));
app.use(middleware.requestLogger);

app.get('/health', (req, res) => res.json({ success: true, data: { service: 'user-service', status: 'ok' } }));
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.use(middleware.notFoundHandler);
app.use(middleware.errorHandler);

export default app;