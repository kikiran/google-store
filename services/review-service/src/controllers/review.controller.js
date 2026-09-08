import { asyncHandler, created, success } from '@nova/shared';
import reviewService from '../services/review.service.js';

export const listReviews = asyncHandler(async (req, res) => {
  const { reviews, meta } = await reviewService.listReviews(req.query);
  success(res, { reviews }, 'Reviews', meta);
});

export const getSummary = asyncHandler(async (req, res) => {
  const summary = await reviewService.getSummary(Number(req.query.productId));
  success(res, { summary }, 'Review summary');
});

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.body);
  created(res, { review }, 'Review submitted for moderation');
});

export const toggleHelpful = asyncHandler(async (req, res) => {
  const result = await reviewService.toggleHelpful(req.user.id, Number(req.params.id));
  success(res, result, 'Helpful vote updated');
});

export default { listReviews, getSummary, createReview, toggleHelpful };