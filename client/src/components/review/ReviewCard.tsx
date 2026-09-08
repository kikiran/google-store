import { RatingStars } from '@/components/ui/Rating';
import type { Review } from '@/types';
import { ThumbsUp } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="py-5 border-b border-ink-100 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <RatingStars value={review.rating} size={14} />
          <h4 className="text-sm font-medium text-ink-900 mt-1">{review.title}</h4>
        </div>
        {review.isVerifiedPurchase && (
          <span className="text-xs text-accent-600 font-medium">Verified purchase</span>
        )}
      </div>
      <p className="text-sm text-ink-600 mb-2">{review.body}</p>
      <div className="flex items-center gap-4 text-xs text-ink-400">
        <span>{review.userName}</span>
        <span>{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
        <span className="flex items-center gap-1"><ThumbsUp size={12} /> {review.helpfulCount}</span>
      </div>
    </div>
  );
}
