import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api';
import { formatINR } from '@/lib/format';
import { fmtDateTime } from '@/lib/date';
import { usePageMeta } from '@/lib/seo';
import { useToast } from '@/context/ToastContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { Order } from '@/types';
import { ChevronLeft, Package, Truck, ShoppingCart } from 'lucide-react';

export default function OrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  usePageMeta({ title: `Order #${orderNumber}` });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [canceling, setCanceling] = useState(false);

  const { data: order, isLoading, error, refetch } = useQuery<Order>({
    queryKey: ['order', orderNumber],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderNumber}`);
      return res.data.data;
    },
    enabled: !!orderNumber,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/orders/${orderNumber}/cancel`),
    onSuccess: async () => {
      toast('Order cancelled successfully', { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['order', orderNumber] });
      await queryClient.invalidateQueries({ queryKey: ['orders-mine'] });
    },
    onError: (err: unknown) => toast(handleApiError(err), { type: 'error' }),
    onSettled: () => setCanceling(false),
  });

  const handleBuyAgain = () => {
    if (!order?.items) return;
    order.items.forEach((item) => {
      if (item.variantId) addItem(item.variantId, item.quantity);
    });
    toast('Items added to cart', { type: 'success' });
    navigate('/cart');
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Spinner /></div>;
  if (error || !order) return <ErrorState title="Order not found" message="We couldn't find this order." onRetry={refetch} />;

  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const shipment = order.shipment as any;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/account/orders" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
        <ChevronLeft size={16} /> Back to orders
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Order #{order.orderNumber}</h1>
          <p className="text-sm text-ink-500 mt-1">Placed on {fmtDateTime(order.placedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.payment_status} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-50 text-left">
              <th className="px-4 py-3 font-medium text-ink-600">Item</th>
              <th className="px-4 py-3 font-medium text-ink-600 text-center">Qty</th>
              <th className="px-4 py-3 font-medium text-ink-600 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-t border-ink-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-ink-50" />
                    )}
                    <div>
                      <div className="font-medium text-ink-900">{item.productName || item.product?.name}</div>
                      <div className="text-xs text-ink-500">{item.variantName || item.variant?.name}{item.sku ? ` · ${item.sku}` : ''}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-ink-700">{item.quantity}</td>
                <td className="px-4 py-3 text-right font-medium text-ink-900">{formatINR(item.lineTotal ?? item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border border-ink-200 p-5 space-y-3">
        <h3 className="font-semibold text-ink-900">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-ink-500">Items</span><span>{formatINR(order.itemsSubtotal)}</span></div>
          {order.discountTotal > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatINR(order.discountTotal)}</span></div>}
          <div className="flex justify-between"><span className="text-ink-500">Shipping</span><span>{order.shippingTotal > 0 ? formatINR(order.shippingTotal) : 'Free'}</span></div>
          {order.taxTotal > 0 && <div className="flex justify-between"><span className="text-ink-500">Tax</span><span>{formatINR(order.taxTotal)}</span></div>}
          <div className="flex justify-between font-semibold text-ink-900 border-t border-ink-200 pt-3">
            <span>Total</span><span>{formatINR(order.grandTotal)}</span>
          </div>
        </div>
        {order.shippingMethodName && (
          <p className="text-sm text-ink-500">Shipping: {order.shippingMethodName}</p>
        )}
      </div>

      {shipment?.trackingNumber && (
        <div className="flex items-center gap-2 text-sm text-ink-700 bg-ink-50 rounded-xl px-4 py-3">
          <Truck size={16} className="text-ink-400" />
          Tracking: <span className="font-medium">{shipment.trackingNumber}</span>
        </div>
      )}

      {order.shippingAddress && (
        <div className="bg-white rounded-2xl border border-ink-200 p-5">
          <h3 className="font-semibold text-ink-900 mb-2">Shipping Address</h3>
          <div className="text-sm text-ink-600 space-y-0.5">
            <p className="font-medium text-ink-900">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>
      )}

      {order.statusEvents && order.statusEvents.length > 0 && (
        <div className="bg-white rounded-2xl border border-ink-200 p-5">
          <h3 className="font-semibold text-ink-900 mb-4">Status History</h3>
          <div className="relative ml-3 border-l-2 border-ink-200 space-y-5">
            {order.statusEvents.map((evt, i) => (
              <div key={i} className="relative pl-6">
                <div className="absolute -left-[11px] top-1 w-4 h-4 rounded-full bg-brand-100 border-2 border-brand-400" />
                <div className="text-sm">
                  <span className="font-medium text-ink-900">{evt.toStatus}</span>
                  {evt.fromStatus && <span className="text-ink-400"> from {evt.fromStatus}</span>}
                </div>
                {evt.note && <p className="text-xs text-ink-500 mt-0.5">{evt.note}</p>}
                {evt.createdAt && <p className="text-xs text-ink-400 mt-0.5">{fmtDateTime(evt.createdAt)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {canCancel && (
          <Button variant="danger" loading={canceling} onClick={() => { setCanceling(true); cancelMutation.mutate(); }}>
            Cancel order
          </Button>
        )}
        <Button variant="secondary" onClick={handleBuyAgain}>
          <ShoppingCart size={16} className="mr-1.5" /> Buy again
        </Button>
      </div>
    </div>
  );
}
