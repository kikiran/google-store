import { config, db } from '@nova/shared';

export const pool = db.createPool(config.dbConfig('DB_CART_SCHEMA'));

export default pool;
