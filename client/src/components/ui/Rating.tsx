import { Star, StarHalf } from 'lucide-react';
import clsx from 'clsx';

interface RatingStarsProps {
  value: number;
  size?: number;
  count?: number;
  showValue?: boolean;
}

export function RatingStars({ value, size = 14, count, showValue = false }: RatingStarsProps) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} size={size} className="fill-amber-400 text-amber-400" />
        ))}
        {half && <StarHalf size={size} className="fill-amber-400 text-amber-400" />}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} size={size} className="text-ink-300" />
        ))}
      </div>
      {showValue && <span className="text-sm text-ink-600 ml-0.5">{value.toFixed(1)}</span>}
      {count !== undefined && <span className="text-sm text-ink-400">({count})</span>}
    </div>
  );
}
