import express from 'express';
import helmet from 'helmet';
import { middleware } from '@nova/shared';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '128kb' }));
app.use(middleware.requestLogger);

app.get('/', (req, res) => res.json({ success: true, data: { service: 'product-service', name: 'Nova Product Service', port: 3003 } }));
app.get('/health', (req, res) => res.json({ success: true, data: { service: 'product-service', status: 'ok' } }));
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/admin', adminRoutes);

app.use(middleware.notFoundHandler);
app.use(middleware.errorHandler);

export default app;
