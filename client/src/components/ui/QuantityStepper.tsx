import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantityStepper({ value, onChange, min = 1, max = 10 }: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-ink-200">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="p-2 text-ink-600 hover:bg-ink-50 disabled:opacity-30 disabled:pointer-events-none transition-colors rounded-l-full"
      >
        <Minus size={16} />
      </button>
      <span className="w-10 text-center text-sm font-medium text-ink-900">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="p-2 text-ink-600 hover:bg-ink-50 disabled:opacity-30 disabled:pointer-events-none transition-colors rounded-r-full"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
