import { asyncHandler, success } from '@nova/shared';
import userService from '../services/user.service.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await userService.adminListUsers(req.query);
  success(res, { users }, 'Users', meta);
});

export const updateRole = asyncHandler(async (req, res) => {
  const user = await userService.adminUpdateRole(req.user.id, req.user.role, Number(req.params.id), req.body.role);
  success(res, { user }, 'Role updated');
});

export const updateStatus = asyncHandler(async (req, res) => {
  const user = await userService.adminUpdateStatus(req.user.id, Number(req.params.id), req.body.isActive);
  success(res, { user }, 'Status updated');
});

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.adminDeleteUser(req.user.id, Number(req.params.id));
  success(res, null, 'User deleted');
});

export default { listUsers, updateRole, updateStatus, deleteUser };