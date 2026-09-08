import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'md' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm',
  secondary: 'bg-ink-100 hover:bg-ink-200 text-ink-900',
  outline: 'border border-ink-300 hover:bg-ink-50 text-ink-700',
  ghost: 'hover:bg-ink-100 text-ink-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  link: 'text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline p-0 h-auto',
};

const sizeClasses: Record<string, string> = {
  sm: 'py-2 px-4 text-sm rounded-full',
  md: 'py-2.5 px-5 text-sm rounded-full',
  lg: 'py-3 px-6 text-base rounded-full',
  icon: 'p-2 rounded-full',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
