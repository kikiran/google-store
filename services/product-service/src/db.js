import { config, db } from '@nova/shared';

export const pool = db.createPool(config.dbConfig('DB_PRODUCT_SCHEMA'));

export default pool;
