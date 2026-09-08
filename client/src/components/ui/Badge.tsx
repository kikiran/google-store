import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'brand' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
}

const colorMap: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-accent-50 text-accent-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  neutral: 'bg-ink-100 text-ink-700',
};

export function Badge({ children, color = 'neutral', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colorMap[color], className)}>
      {children}
    </span>
  );
}
