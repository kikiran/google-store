import express from 'express';
import helmet from 'helmet';
import { config, middleware } from '@nova/shared';
import cartRoutes from './routes/cart.routes.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '128kb' }));
app.use(middleware.requestLogger);

app.get('/health', (req, res) => res.json({ success: true, data: { service: 'cart-service', status: 'ok' } }));
app.use('/api/cart', cartRoutes);

app.use(middleware.notFoundHandler);
app.use(middleware.errorHandler);

export default app;
