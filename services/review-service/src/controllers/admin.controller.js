import { asyncHandler, success } from '@nova/shared';
import reviewService from '../services/review.service.js';

export const listReviews = asyncHandler(async (req, res) => {
  const { reviews, meta } = await reviewService.adminListReviews(req.query);
  success(res, { reviews }, 'Moderation queue', meta);
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.adminUpdateReview(Number(req.params.id), req.body);
  success(res, { review }, 'Review moderated');
});

export default { listReviews, updateReview };