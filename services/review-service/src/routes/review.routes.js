import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/review.controller.js';
import {
  listReviewsSchema,
  reviewSummarySchema,
  createReviewSchema,
  helpfulParams,
} from '../schemas/review.schema.js';

const router = Router();
const { validate, requireAuth } = middleware;

router.get('/summary', validate(reviewSummarySchema), controller.getSummary);
router.get('/', validate(listReviewsSchema), controller.listReviews);
router.post('/', requireAuth, validate(createReviewSchema), controller.createReview);
router.post('/:id/helpful', requireAuth, validate(helpfulParams), controller.toggleHelpful);

export default router;