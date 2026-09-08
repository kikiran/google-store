import { ReviewCard } from '@/components/review/ReviewCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import type { Review } from '@/types';

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
}

export function ReviewList({ reviews, loading }: ReviewListProps) {
  if (loading) {
    return <div className="py-8 flex justify-center"><Spinner /></div>;
  }
  if (reviews.length === 0) {
    return <EmptyState title="No reviews yet" description="Be the first to review this product." />;
  }
  return (
    <div>
      {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
    </div>
  );
}
