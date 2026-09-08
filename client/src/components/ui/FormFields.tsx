import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-full border px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 transition-colors',
        error ? 'border-red-500 focus:ring-red-500' : 'border-ink-300',
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, error, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={clsx(
        'w-full rounded-full border px-4 py-2.5 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 transition-colors appearance-none',
        error ? 'border-red-500' : 'border-ink-300',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'w-full rounded-xl border px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 transition-colors resize-y',
        error ? 'border-red-500' : 'border-ink-300',
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ label, className, ...props }, ref) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        ref={ref}
        type="checkbox"
        className={clsx('w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500', className)}
        {...props}
      />
      <span className="text-sm text-ink-700">{label}</span>
    </label>
  );
});
Checkbox.displayName = 'Checkbox';
