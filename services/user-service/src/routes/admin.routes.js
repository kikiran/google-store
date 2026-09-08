import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/admin.controller.js';
import {
  adminListUsersSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  deleteUserParams,
} from '../schemas/user.schema.js';

const router = Router();
const { validate, requireRole } = middleware;

router.use(requireRole('ADMIN'));

router.get('/users', validate(adminListUsersSchema), controller.listUsers);
router.patch('/users/:id/role', validate(updateUserRoleSchema), controller.updateRole);
router.patch('/users/:id/status', validate(updateUserStatusSchema), controller.updateStatus);
router.delete('/users/:id', validate(deleteUserParams), controller.deleteUser);

export default router;