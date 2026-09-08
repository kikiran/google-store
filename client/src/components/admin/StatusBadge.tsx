import clsx from 'clsx';

const colors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  SHIPPED: 'bg-indigo-50 text-indigo-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
  REFUNDED: 'bg-gray-50 text-gray-700',
  PAID: 'bg-green-50 text-green-700',
  UNPAID: 'bg-amber-50 text-amber-700',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colors[status] ?? 'bg-ink-50 text-ink-600')}>
      {status}
    </span>
  );
}
