import { config, db } from '@nova/shared';

export const pool = db.createPool(config.dbConfig('DB_SHIPPING_SCHEMA'));

export default pool;
