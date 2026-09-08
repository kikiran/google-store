import { asyncHandler, created, success } from '@nova/shared';
import userService from '../services/user.service.js';
import addressService from '../services/address.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user.id);
  success(res, { user }, 'Current user');
});

export const updateMe = asyncHandler(async (req, res) => {
  const profile = await userService.updateMe(req.user.id, req.body);
  success(res, { profile }, 'Profile updated');
});

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.listAddresses(req.user.id);
  success(res, { addresses }, 'Addresses');
});

export const createAddress = asyncHandler(async (req, res) => {
  const address = await addressService.createAddress(req.user.id, req.body);
  created(res, { address }, 'Address created');
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.updateAddress(req.user.id, Number(req.params.id), req.body);
  success(res, { address }, 'Address updated');
});

export const deleteAddress = asyncHandler(async (req, res) => {
  await addressService.deleteAddress(req.user.id, Number(req.params.id));
  success(res, null, 'Address deleted');
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await addressService.setDefaultAddress(req.user.id, Number(req.params.id));
  success(res, { address }, 'Default address set');
});

export default { getMe, updateMe, listAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress };