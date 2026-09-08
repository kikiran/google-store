import { config } from '@nova/shared';

export const PRODUCT_SERVICE_URL = config.env('PRODUCT_SERVICE_URL', 'http://localhost:3003');
export const INVENTORY_SERVICE_URL = config.env('INVENTORY_SERVICE_URL', 'http://localhost:3004');
export const PORT = config.envInt('PORT_CART', 3005);

export default { PRODUCT_SERVICE_URL, INVENTORY_SERVICE_URL, PORT };
