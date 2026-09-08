import { ApiError, db } from '@nova/shared';
import pool from '../db.js';
import reviewRepository from '../repositories/review.repository.js';

function serializeReview(row, userName = null, moderationNote = null) {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    userId: String(row.user_id),
    userName,
    rating: row.rating,
    title: row.title,
    body: row.body,
    isVerifiedPurchase: Boolean(row.is_verified_purchase),
    helpfulCount: Number(row.helpful_count),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(moderationNote === null ? {} : { moderationNote }),
  };
}

export async function listReviews({ productId, page, limit }) {
  const [rows, total] = await Promise.all([
    reviewRepository.findApprovedPageable(productId, page, limit),
    reviewRepository.countApproved(productId),
  ]);
  const names = await reviewRepository.findUserNames(rows.map((r) => String(r.user_id)));
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    reviews: rows.map((r) => serializeReview(r, names.get(String(r.user_id)))),
    meta: { page, limit, total, totalPages },
  };
}

export async function getSummary(productId) {
  const s = await reviewRepository.findSummary(productId);
  return {
    average: Number(Number(s.average).toFixed(1)),
    count: Number(s.cnt),
    distribution: {
      1: Number(s.r1),
      2: Number(s.r2),
      3: Number(s.r3),
      4: Number(s.r4),
      5: Number(s.r5),
    },
  };
}

export async function createReview(userId, data) {
  if (!(await reviewRepository.productExists(data.productId))) {
    throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
  }
  const isVerifiedPurchase = await reviewRepository.hasVerifiedPurchase(data.productId, userId);
  const review = await reviewRepository.create({
    productId: data.productId,
    userId,
    rating: data.rating,
    title: data.title,
    body: data.body,
    isVerifiedPurchase,
  });
  return serializeReview(review);
}

export async function toggleHelpful(userId, reviewId) {
  const review = await reviewRepository.findById(reviewId);
  if (!review) throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');

  return db.transaction(pool, async (conn) => {
    const existing = await reviewRepository.findHelpful(reviewId, userId, conn);
    if (existing) {
      await reviewRepository.removeHelpful(reviewId, userId, conn);
      await reviewRepository.decrementHelpful(reviewId, conn);
      return { helpfulCount: Math.max(Number(review.helpful_count) - 1, 0), helpful: false };
    }
    await reviewRepository.addHelpful(reviewId, userId, conn);
    await reviewRepository.incrementHelpful(reviewId, conn);
    return { helpfulCount: Number(review.helpful_count) + 1, helpful: true };
  });
}

export async function adminListReviews({ status, page, limit }) {
  const [rows, total] = await Promise.all([
    reviewRepository.adminFindPageable(status, page, limit),
    reviewRepository.adminCount(status),
  ]);
  const names = await reviewRepository.findUserNames(rows.map((r) => String(r.user_id)));
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    reviews: rows.map((r) => serializeReview(r, names.get(String(r.user_id)))),
    meta: { page, limit, total, totalPages },
  };
}

export async function adminUpdateReview(id, { status, moderationNote }) {
  const existing = await reviewRepository.findById(id);
  if (!existing) throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
  const updated = await reviewRepository.adminUpdateStatus(id, status);
  return serializeReview(updated, null, moderationNote ?? null);
}

export default {
  listReviews,
  getSummary,
  createReview,
  toggleHelpful,
  adminListReviews,
  adminUpdateReview,
};