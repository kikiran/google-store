import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { usePageMeta } from '@/lib/seo';
import { formatINR } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { PriceDisplay } from '@/components/ui/Price';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

const MAX_QTY = 10;

export default function CartPage() {
  usePageMeta({ title: 'Cart' });
  const navigate = useNavigate();
  const { cart, isLoading, refetch, updateQuantity, removeItem } = useCart();
  const { isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="container-nova py-10">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="container-nova py-16">
        <ErrorState message="We couldn't load your cart." onRetry={refetch} />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container-nova py-16">
        <EmptyState
          icon={<ShoppingBag size={48} />}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Let's find you something great."
          action={{ label: 'Continue shopping', onClick: () => navigate('/products') }}
        />
      </div>
    );
  }

  const subtotal = cart.subtotal ?? cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discount = cart.compareAtSubtotal && cart.compareAtSubtotal > subtotal
    ? cart.compareAtSubtotal - subtotal
    : (cart.discount ?? 0);

  return (
    <div className="container-nova py-10">
      <h1 className="text-2xl font-medium text-ink-900 mb-6">Shopping cart</h1>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => {
            const variantImage = item.variant.imageUrl;
            const price = item.unitPrice ?? item.variant.price ?? 0;
            return (
              <div key={item.id} className="flex gap-4 rounded-2xl border border-ink-200 p-4">
                <Link to={`/product/${item.product.slug}`} className="shrink-0 w-24 h-24 rounded-xl bg-ink-50 overflow-hidden flex items-center justify-center">
                  {variantImage ? (
                    <img src={variantImage} alt={item.product.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-2xl text-ink-300"><ShoppingBag size={20} /></span>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={`/product/${item.product.slug}`} className="text-sm font-medium text-ink-900 hover:text-brand-600">
                        {item.product.name}
                      </Link>
                      <div className="mt-1 flex gap-1.5 flex-wrap">
                        {item.variant.name && (
                          <span className="px-2 py-0.5 bg-ink-50 rounded-full text-xs text-ink-600">{item.variant.name}</span>
                        )}
                        {item.variant.color && (
                          <span className="px-2 py-0.5 bg-ink-50 rounded-full text-xs text-ink-600">{item.variant.color}</span>
                        )}
                        {item.variant.storage && (
                          <span className="px-2 py-0.5 bg-ink-50 rounded-full text-xs text-ink-600">{item.variant.storage}</span>
                        )}
                      </div>
                    </div>
                    <IconButton onClick={() => removeItem(item.id)} title="Remove" className="text-ink-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </IconButton>
                  </div>

                  <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                    <QuantityStepper value={item.quantity} onChange={(v) => updateQuantity(item.id, v)} min={1} max={MAX_QTY} />
                    <div className="text-right">
                      <div className="font-medium text-ink-900">{formatINR(price * item.quantity)}</div>
                      {item.quantity > 1 && <div className="text-xs text-ink-400">{formatINR(price)} each</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-ink-200 p-6 space-y-4">
            <h2 className="text-lg font-medium text-ink-900">Order summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-600">Subtotal</span>
                <span className="text-ink-900 font-medium">{formatINR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-600">Discount</span>
                  <span className="text-accent-600 font-medium">− {formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-600">Shipping</span>
                <span className="text-accent-700 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-xs text-ink-400">
                <span>Tax</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <div className="border-t border-ink-100 pt-3 flex justify-between items-center">
              <span className="font-medium text-ink-900">Total</span>
              <span className="text-xl font-semibold text-ink-900">{formatINR(subtotal - discount)}</span>
            </div>
            {discount > 0 && (
              <p className="text-xs text-accent-600">You save {formatINR(discount)}</p>
            )}

            <Button fullWidth onClick={() => navigate('/checkout')}>
              Proceed to checkout
            </Button>
            <Link to="/products" className="block text-center text-sm text-brand-600 hover:text-brand-700">
              Continue shopping
            </Link>

            {!isAuthenticated && (
              <p className="text-xs text-ink-400 text-center pt-2 border-t border-ink-100">
                You can check out as guest.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
