import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/admin.controller.js';
import { adminListReviewsSchema, adminUpdateReviewSchema } from '../schemas/review.schema.js';

const router = Router();
const { validate, requireRole } = middleware;

router.use(requireRole('ADMIN', 'MANAGER'));

router.get('/reviews', validate(adminListReviewsSchema), controller.listReviews);
router.patch('/reviews/:id', validate(adminUpdateReviewSchema), controller.updateReview);

export default router;