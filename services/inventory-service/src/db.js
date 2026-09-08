import { config, db } from '@nova/shared';

export const pool = db.createPool(config.dbConfig('DB_INVENTORY_SCHEMA'));

export default pool;
