import express from 'express';
import helmet from 'helmet';
import { middleware } from '@nova/shared';
import searchRoutes from './routes/search.routes.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '128kb' }));
app.use(middleware.requestLogger);

app.get('/', (req, res) => res.json({ success: true, data: { service: 'search-service', name: 'Nova Search Service', port: 3010 } }));
app.get('/health', (req, res) => res.json({ success: true, data: { service: 'search-service', status: 'ok' } }));
app.use('/api/search', searchRoutes);

app.use(middleware.notFoundHandler);
app.use(middleware.errorHandler);

export default app;
