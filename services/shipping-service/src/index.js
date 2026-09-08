import { config, logger } from '@nova/shared';
import app from './app.js';
import { pool } from './db.js';

const port = Number(config.env('PORT_SHIPPING', '3008'));

async function start() {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connection verified (nova_shipping)');
  } catch (err) {
    logger.warn({ err: err.message }, 'Database not reachable yet — retrying in 3s');
    setTimeout(start, 3000);
    return;
  }
  app.listen(port, () => logger.info(`[shipping-service] listening on :${port}`));
}

start();
