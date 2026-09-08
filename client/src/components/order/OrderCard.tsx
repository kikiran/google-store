import { Link } from 'react-router-dom';
import { formatINR } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
}

const statusColor: Record<string, 'brand' | 'success' | 'warning' | 'error' | 'neutral'> = {
  PENDING: 'warning',
  CONFIRMED: 'brand',
  SHIPPED: 'brand',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <Link
      to={`/account/orders/${order.orderNumber}`}
      className="block border border-ink-200 rounded-2xl p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-medium text-ink-900">#{order.orderNumber}</span>
          <span className="text-sm text-ink-400 ml-3">{new Date(order.placedAt).toLocaleDateString('en-IN')}</span>
        </div>
        <Badge color={statusColor[order.status] ?? 'neutral'}>{order.status}</Badge>
      </div>
      <div className="flex gap-2 mb-3">
        {order.items.slice(0, 4).map((item) => (
          <div key={item.id} className="w-12 h-12 rounded-lg bg-ink-50 overflow-hidden">
            {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />}
          </div>
        ))}
        {order.items.length > 4 && (
          <div className="w-12 h-12 rounded-lg bg-ink-50 flex items-center justify-center text-xs text-ink-500">
            +{order.items.length - 4}
          </div>
        )}
      </div>
      <div className="text-sm font-medium text-ink-900">Total: {formatINR(order.grandTotal)}</div>
    </Link>
  );
}
