import { asyncHandler, created, success } from '@nova/shared';
import shippingService from '../services/shipping.service.js';

export const listMethods = asyncHandler(async (req, res) => {
  const methods = await shippingService.listMethods();
  success(res, methods, 'Shipping methods retrieved');
});

export const createShipment = asyncHandler(async (req, res) => {
  const { shipment, created } = await shippingService.createShipment(req.body);
  if (created) {
    created(res, shipment, 'Shipment created');
  } else {
    success(res, shipment, 'Shipment already exists');
  }
});

export const getByOrderId = asyncHandler(async (req, res) => {
  const shipment = await shippingService.getShipmentByOrderId(Number(req.params.orderId));
  success(res, shipment, 'Shipment retrieved');
});

export const getByTrackingNumber = asyncHandler(async (req, res) => {
  const shipment = await shippingService.getShipmentByTrackingNumber(req.params.trackingNumber);
  success(res, shipment, 'Shipment retrieved');
});

export const addEvent = asyncHandler(async (req, res) => {
  const shipment = await shippingService.addShipmentEvent(Number(req.params.id), req.body);
  success(res, shipment, 'Shipment event added');
});

export default { listMethods, createShipment, getByOrderId, getByTrackingNumber, addEvent };
