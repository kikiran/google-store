import clsx from 'clsx';
import { formatINR } from '@/lib/format';

interface PriceDisplayProps {
  price: number;
  compareAt?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
};

export function PriceDisplay({ price, compareAt, size = 'md', className }: PriceDisplayProps) {
  const discount = compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null;

  return (
    <div className={clsx('flex items-center gap-2 flex-wrap', className)}>
      <span className={clsx('font-medium text-ink-900', sizeClasses[size])}>{formatINR(price)}</span>
      {compareAt && compareAt > price && (
        <>
          <span className="text-ink-400 line-through text-sm">{formatINR(compareAt)}</span>
          <span className="text-accent-600 text-xs font-medium">-{discount}%</span>
        </>
      )}
    </div>
  );
}
