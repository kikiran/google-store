import clsx from 'clsx';
import { Check } from 'lucide-react';

const steps = ['Cart', 'Details', 'Delivery', 'Payment', 'Review'];

interface CheckoutStepsProps {
  current: number;
}

export default function CheckoutSteps({ current }: CheckoutStepsProps) {
  return (
    <div className="flex items-center justify-between max-w-2xl mx-auto mb-8">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  done ? 'bg-accent-600 text-white' : active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500',
                )}
              >
                {done ? <Check size={16} /> : i + 1}
              </div>
              <span className={clsx('text-xs font-medium', active ? 'text-brand-600' : 'text-ink-500')}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={clsx('flex-1 h-px mx-2 mt-[-16px]', done ? 'bg-accent-600' : 'bg-ink-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
