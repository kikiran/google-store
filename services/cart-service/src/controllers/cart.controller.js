import { asyncHandler, success } from '@nova/shared';
import cartService from '../services/cart.service.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req);
  success(res, cart, 'Cart retrieved');
});

export const addItem = asyncHandler(async (req, res) => {
  const cart = await cartService.addItem(req, req.body);
  success(res, cart, 'Item added to cart');
});

export const updateItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateItem(req, Number(req.params.id), req.body);
  success(res, cart, 'Cart updated');
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req, Number(req.params.id));
  success(res, cart, 'Item removed from cart');
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req);
  success(res, cart, 'Cart cleared');
});

export const mergeGuestCart = asyncHandler(async (req, res) => {
  const cart = await cartService.mergeGuestCart(req, req.body.guestSessionKey);
  success(res, cart, 'Guest cart merged');
});

export const getCount = asyncHandler(async (req, res) => {
  const result = await cartService.getCount(req);
  success(res, result, 'Cart count');
});

export default { getCart, addItem, updateItem, removeItem, clearCart, mergeGuestCart, getCount };
