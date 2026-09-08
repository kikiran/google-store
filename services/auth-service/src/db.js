import { config, db } from '@nova/shared';

export const pool = db.createPool(config.dbConfig('DB_USER_SCHEMA'));

export default pool;