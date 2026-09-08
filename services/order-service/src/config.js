import { config } from '@nova/shared';

export const PORT = config.envInt('PORT_ORDER', 3006);

export const PRODUCT_SERVICE_URL = config.env('PRODUCT_SERVICE_URL', 'http://localhost:3003');
export const INVENTORY_SERVICE_URL = config.env('INVENTORY_SERVICE_URL', 'http://localhost:3004');
export const PAYMENT_SERVICE_URL = config.env('PAYMENT_SERVICE_URL', 'http://localhost:3007');
export const SHIPPING_SERVICE_URL = config.env('SHIPPING_SERVICE_URL', 'http://localhost:3008');
export const NOTIFICATION_SERVICE_URL = config.env('NOTIFICATION_SERVICE_URL', 'http://localhost:3011');

export default {
  PORT,
  PRODUCT_SERVICE_URL,
  INVENTORY_SERVICE_URL,
  PAYMENT_SERVICE_URL,
  SHIPPING_SERVICE_URL,
  NOTIFICATION_SERVICE_URL,
};
