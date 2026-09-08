import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes: Record<string, string> = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ loading, size = 'md', className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center rounded-full transition-colors hover:bg-ink-100 text-ink-600 focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 disabled:pointer-events-none',
          sizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
