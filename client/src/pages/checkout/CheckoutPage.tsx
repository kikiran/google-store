import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, CheckCircle2, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { handleApiError } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { usePageMeta } from '@/lib/seo';
import { formatINR } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field, Textarea } from '@/components/ui/FormFields';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import type { Address, ShippingMethod, Order } from '@/types';

type Stage = 'details' | 'delivery' | 'payment' | 'review';

interface ShippingForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface PaymentForm {
  method: 'card' | 'upi' | 'mock';
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  upiVpa: string;
}

const DEFAULT_SHIPPING: ShippingForm = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

export default function CheckoutPage() {
  usePageMeta({ title: 'Checkout' });
  const navigate = useNavigate();
  const { cart, isLoading, clear } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [stage, setStage] = useState<Stage>('details');
  const [email, setEmail] = useState(user?.email ?? '');
  const [name, setName] = useState(user ? `${user.firstName} ${user.lastName}`.trim() : '');
  const [shipping, setShipping] = useState<ShippingForm>(() => ({
    ...DEFAULT_SHIPPING,
    fullName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
  }));
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [coupon, setCoupon] = useState('');
  const [payment, setPayment] = useState<PaymentForm>({ method: 'card', cardNumber: '', cardExpiry: '', cardCvv: '', upiVpa: '' });
  const [deliveryCode, setDeliveryCode] = useState('');
  const [placeError, setPlaceError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const stageIndex: Record<Stage, number> = { details: 1, delivery: 2, payment: 3, review: 4 };

  const addressesQuery = useQuery({
    queryKey: ['my-addresses'],
    queryFn: async () => {
      const res = await api.get('/users/me/addresses');
      return (res.data.data as Address[]) ?? [];
    },
    enabled: isAuthenticated,
  });

  const shippingQuery = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      const res = await api.get('/shipping/methods');
      return (res.data.data as ShippingMethod[]) ?? [];
    },
  });

  const cartItems = cart?.items ?? [];
  const cartNotEmpty = cartItems.length > 0;

  /* Guard: redirect if cart empty and nothing just placed */
  useEffect(() => {
    if (!isLoading && !cartNotEmpty && !placedOrder) {
      const t = setTimeout(() => navigate('/cart', { replace: true }), 0);
      return () => clearTimeout(t);
    }
  }, [isLoading, cartNotEmpty, placedOrder, navigate]);

  /* Prefill email for guest from localStorage if available */
  useEffect(() => {
    if (!email) setEmail(localStorage.getItem('nova_checkout_email') ?? '');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Default delivery method */
  useEffect(() => {
    if (!deliveryCode && shippingQuery.data?.length) {
      const standard = shippingQuery.data.find((m) => m.code === 'standard') ?? shippingQuery.data[0];
      setDeliveryCode(standard.code);
    }
  }, [shippingQuery.data, deliveryCode]);

  const deliveryMethod = shippingQuery.data?.find((m) => m.code === deliveryCode);

  const subtotal = cart?.subtotal ?? cartItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const deliveryFee = deliveryMethod?.fee ?? 0;

  const orderMutation = useMutation({
    mutationFn: async () => {
      const items = cartItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
      const body = {
        email,
        name,
        shippingAddress: {
          fullName: shipping.fullName,
          phone: shipping.phone,
          addressLine1: shipping.addressLine1,
          addressLine2: shipping.addressLine2 || undefined,
          city: shipping.city,
          state: shipping.state,
          postalCode: shipping.postalCode,
          country: shipping.country,
        },
        deliveryMethod: deliveryCode,
        couponCode: coupon || null,
        items,
        payment:
          payment.method === 'upi'
            ? { method: 'upi', upi: { vpa: payment.upiVpa } }
            : payment.method === 'card'
            ? {
                method: 'card',
                card: { number: payment.cardNumber, expiry: payment.cardExpiry, cvv: payment.cardCvv },
              }
            : { method: 'mock' },
      };
      const res = await api.post('/orders', body);
      return res.data.data as { order: Order; payment: unknown; shipment: unknown; trackingNumber?: string };
    },
    onSuccess: (data) => {
      clear();
      localStorage.setItem('nova_checkout_email', email);
      toast('Order placed successfully!', { type: 'success', title: 'Thank you!' });
      const order = data.order;
      if (isAuthenticated) {
        navigate(`/account/orders/${order.orderNumber}`, { replace: true });
      } else {
        setPlacedOrder(order);
      }
    },
  });

  const validateDetails = (): boolean => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast('Enter a valid email address', { type: 'error' });
      return false;
    }
    if (!shipping.fullName.trim()) { toast('Enter your full name', { type: 'error' }); return false; }
    if (!shipping.phone.trim() || shipping.phone.replace(/\D/g, '').length < 10) { toast('Enter a valid phone number', { type: 'error' }); return false; }
    if (!shipping.addressLine1.trim()) { toast('Enter your address', { type: 'error' }); return false; }
    if (!shipping.city.trim()) { toast('Enter your city', { type: 'error' }); return false; }
    if (!shipping.state.trim()) { toast('Enter your state', { type: 'error' }); return false; }
    if (!shipping.postalCode.trim() || shipping.postalCode.replace(/\D/g, '').length < 6) { toast('Enter a valid postal code', { type: 'error' }); return false; }
    return true;
  };

  const validatePayment = (): boolean => {
    if (payment.method === 'card') {
      if (payment.cardNumber.replace(/\s/g, '').length < 12) { toast('Enter a valid card number', { type: 'error' }); return false; }
      if (!/^\d{2}\/\d{2}$/.test(payment.cardExpiry)) { toast('Enter expiry as MM/YY', { type: 'error' }); return false; }
      if (payment.cardCvv.replace(/\D/g, '').length < 3) { toast('Enter a valid CVV', { type: 'error' }); return false; }
    }
    if (payment.method === 'upi' && !/^[\w.\-]+@[\w]+$/.test(payment.upiVpa)) {
      toast('Enter a valid UPI ID', { type: 'error' });
      return false;
    }
    return true;
  };

  const continueDetails = () => {
    if (!validateDetails()) return;
    setPlaceError('');
    setStage('delivery');
  };

  const continueDelivery = () => {
    if (!deliveryMethod) { toast('Select a delivery option', { type: 'error' }); return; }
    setStage('payment');
  };

  const continuePayment = () => {
    if (!validatePayment()) return;
    setStage('review');
  };

  const submitOrder = () => {
    if (!deliveryMethod) { toast('Select a delivery option', { type: 'error' }); setStage('delivery'); return; }
    setPlaceError('');
    setPlacing(true);
    orderMutation.mutate(undefined, {
      onError: (err: unknown) => {
        setPlacing(false);
        const status = (err as any)?.response?.status;
        const code = (err as any)?.response?.data?.error?.code;
        const msg = handleApiError(err);
        if (status === 402 || code === 'PAYMENT_FAILED') {
          setPlaceError(`Payment failed: ${msg}. Please try a different card or method.`);
          setStage('payment');
        } else if (status === 409 || code === 'INSUFFICIENT_STOCK') {
          setPlaceError(`Some items are no longer available: ${msg}. Please review your cart.`);
          navigate('/cart');
        } else {
          setPlaceError(msg || 'We could not place your order. Please try again.');
        }
      },
      onSettled: () => setPlacing(false),
    });
  };

  /* Confirmation screen for guests */
  if (placedOrder) {
    return (
      <div className="container-nova py-16 max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-3xl font-semibold text-ink-900">Order confirmed!</h1>
          <p className="text-ink-500 mt-2">Thank you for your order. We've sent a confirmation to {placedOrder.customerEmail || email}.</p>
        </div>

        <div className="rounded-2xl border border-ink-200 p-6 space-y-4 mb-6">
          {placedOrder.tracking && (
            <div className="flex items-center gap-3 text-sm">
              <Package size={18} className="text-brand-600" />
              <div>
                <span className="text-ink-500">Tracking number:</span>
                <span className="font-medium text-ink-900 ml-1">{placedOrder.tracking}</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-ink-100 pt-4">
            <span className="text-ink-600">Order number</span>
            <span className="font-semibold text-ink-900">#{placedOrder.orderNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-600">Estimated delivery</span>
            <span className="text-ink-900 font-medium">
              {deliveryMethod ? `${deliveryMethod.estimatedDaysMin}–${deliveryMethod.estimatedDaysMax} days` : '3–7 days'}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          {placedOrder.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-ink-200 p-4 text-sm">
              <div>
                <div className="font-medium text-ink-900">{item.productName ?? item.product?.name}</div>
                <div className="text-ink-500">Qty {item.quantity}</div>
              </div>
              <span className="font-medium text-ink-900">{formatINR((item.lineTotal ?? (item.unitPrice * item.quantity)) as number)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-ink-50 p-6 space-y-2 text-sm mb-8">
          <div className="flex justify-between"><span className="text-ink-600">Subtotal</span><span className="text-ink-900">{formatINR(placedOrder.itemsSubtotal ?? subtotal)}</span></div>
          {placedOrder.discountTotal > 0 && (
            <div className="flex justify-between"><span className="text-ink-600">Discount</span><span className="text-accent-600">− {formatINR(placedOrder.discountTotal)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-ink-600">Delivery</span><span className="text-ink-900">{deliveryFee === 0 ? 'Free' : formatINR(deliveryFee)}</span></div>
          {placedOrder.taxTotal > 0 && (
            <div className="flex justify-between"><span className="text-ink-600">Tax</span><span className="text-ink-900">{formatINR(placedOrder.taxTotal)}</span></div>
          )}
          <div className="border-t border-ink-200 pt-2 flex justify-between font-semibold">
            <span className="text-ink-900">Total</span>
            <span className="text-ink-900">{formatINR(placedOrder.grandTotal ?? subtotal + deliveryFee)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/products" className="flex-1"><Button fullWidth>Continue shopping</Button></Link>
          <Link to="/" className="flex-1"><Button variant="outline" fullWidth>Back to home</Button></Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="container-nova py-16 text-center text-ink-500">Loading your cart…</div>;
  }

  if (!cartNotEmpty) {
    return (
      <div className="container-nova py-16">
        <EmptyState
          title="Your cart is empty"
          description="Add some items before checking out."
          action={{ label: 'Continue shopping', onClick: () => navigate('/products') }}
        />
      </div>
    );
  }

  return (
    <div className="container-nova py-8 max-w-4xl">
      <Link to="/cart" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mb-6">
        <ArrowLeft size={16} /> Back to cart
      </Link>

      <CheckoutSteps current={stageIndex[stage]} />

      {placeError && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <span>{placeError}</span>
        </div>
      )}

      {/* DETAILS */}
      {stage === 'details' && (
        <>
          <h1 className="text-2xl font-medium text-ink-900 mb-6">Contact & delivery details</h1>

          {isAuthenticated && addressesQuery.data && addressesQuery.data.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-ink-700 mb-2">Saved addresses</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {addressesQuery.data.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddressId(addr.id ?? null);
                      setShipping({
                        fullName: addr.fullName,
                        phone: addr.phone,
                        addressLine1: addr.addressLine1,
                        addressLine2: addr.addressLine2 ?? '',
                        city: addr.city,
                        state: addr.state,
                        postalCode: addr.postalCode,
                        country: addr.country || 'India',
                      });
                      if (addr.fullName && addr.fullName.includes(' ')) setName(addr.fullName);
                    }}
                    className={`text-left rounded-2xl border p-4 transition-colors ${
                      selectedAddressId === addr.id ? 'border-brand-600 bg-brand-50' : 'border-ink-200 hover:border-ink-400'
                    }`}
                  >
                    {addr.label && <div className="text-xs text-brand-600 font-medium mb-1">{addr.label}</div>}
                    <div className="text-sm font-medium text-ink-900">{addr.fullName}</div>
                    <div className="text-sm text-ink-600">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</div>
                    <div className="text-sm text-ink-600">{addr.city}, {addr.state} — {addr.postalCode}</div>
                    <div className="text-sm text-ink-600">{addr.phone}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-5 rounded-2xl border border-ink-200 p-6">
            <Field label="Email" htmlFor="checkout-email">
              <Input id="checkout-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Full name" htmlFor="checkout-name">
              <Input id="checkout-name" value={shipping.fullName} onChange={(e) => { setShipping({ ...shipping, fullName: e.target.value }); setName(e.target.value); }} placeholder="Jane Doe" />
            </Field>
            <Field label="Phone" htmlFor="checkout-phone">
              <Input id="checkout-phone" type="tel" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Address line 1" htmlFor="checkout-addr1">
              <Textarea id="checkout-addr1" rows={2} value={shipping.addressLine1} onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })} placeholder="House no, street, area" />
            </Field>
            <Field label="Address line 2" htmlFor="checkout-addr2">
              <Input id="checkout-addr2" value={shipping.addressLine2} onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })} placeholder="Landmark (optional)" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="City" htmlFor="checkout-city">
                <Input id="checkout-city" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
              </Field>
              <Field label="State" htmlFor="checkout-state">
                <Input id="checkout-state" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} />
              </Field>
              <Field label="Postal code" htmlFor="checkout-pin">
                <Input id="checkout-pin" value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} placeholder="560001" />
              </Field>
              <Field label="Country" htmlFor="checkout-country">
                <Select id="checkout-country" value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })}>
                  <option value="India">India</option>
                </Select>
              </Field>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={continueDetails} size="lg">Continue to delivery</Button>
          </div>
        </>
      )}

      {/* DELIVERY */}
      {stage === 'delivery' && (
        <>
          <h1 className="text-2xl font-medium text-ink-900 mb-6">Choose a delivery option</h1>
          {shippingQuery.isLoading ? (
            <div className="space-y-3">Loading…</div>
          ) : shippingQuery.isError ? (
            <ErrorState message="We couldn't load delivery options." onRetry={() => shippingQuery.refetch()} />
          ) : (
            <div className="space-y-3">
              {(shippingQuery.data ?? []).map((m) => (
                <button
                  key={m.code}
                  onClick={() => setDeliveryCode(m.code)}
                  className={`w-full text-left rounded-2xl border p-5 transition-colors ${
                    deliveryCode === m.code ? 'border-brand-600 bg-brand-50' : 'border-ink-200 hover:border-ink-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-ink-900">{m.name}</div>
                      {m.description && <div className="text-sm text-ink-500 mt-0.5">{m.description}</div>}
                      <div className="text-xs text-ink-400 mt-1">{m.estimatedDaysMin}–{m.estimatedDaysMax} days</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-ink-900">{m.fee === 0 ? 'Free' : formatINR(m.fee)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStage('details')}><ArrowLeft size={16} className="mr-1" /> Back</Button>
            <Button onClick={continueDelivery} size="lg">Continue to payment</Button>
          </div>
        </>
      )}

      {/* PAYMENT */}
      {stage === 'payment' && (
        <>
          <h1 className="text-2xl font-medium text-ink-900 mb-6">Payment</h1>
          <div className="space-y-4 rounded-2xl border border-ink-200 p-6">
            <div className="grid sm:grid-cols-3 gap-3">
              {(['card', 'upi', 'mock'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPayment({ ...payment, method: m })}
                  className={`rounded-2xl border p-4 text-center capitalize transition-colors ${
                    payment.method === m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-700 hover:border-ink-400'
                  }`}
                >
                  {m === 'mock' ? 'Mock (demo)' : m === 'upi' ? 'UPI' : 'Card'}
                </button>
              ))}
            </div>

            <div className="h-px bg-ink-100" />

            {payment.method === 'card' && (
              <div className="space-y-4">
                <Field label="Card number" htmlFor="cc-num">
                  <Input
                    id="cc-num"
                    inputMode="numeric"
                    placeholder="4111 1111 1111 1111"
                    value={payment.cardNumber}
                    onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value.replace(/[^\d\s]/g, '') })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiry (MM/YY)" htmlFor="cc-exp">
                    <Input id="cc-exp" placeholder="12/30" value={payment.cardExpiry} onChange={(e) => setPayment({ ...payment, cardExpiry: e.target.value })} />
                  </Field>
                  <Field label="CVV" htmlFor="cc-cvv">
                    <Input id="cc-cvv" inputMode="numeric" type="password" placeholder="123" value={payment.cardCvv} onChange={(e) => setPayment({ ...payment, cardCvv: e.target.value.replace(/\D/g, '') })} />
                  </Field>
                </div>
              </div>
            )}

            {payment.method === 'upi' && (
              <Field label="UPI ID" htmlFor="upi-id">
                <Input id="upi-id" placeholder="yourname@okhdfcbank" value={payment.upiVpa} onChange={(e) => setPayment({ ...payment, upiVpa: e.target.value })} />
              </Field>
            )}

            {payment.method === 'mock' && (
              <p className="text-sm text-ink-500">Using demo payment — no real charge will be made.</p>
            )}

            <p className="flex items-center gap-1.5 text-xs text-ink-400">
              <ShieldCheck size={14} className="text-accent-600" /> Demo mode — no real payment. Cards ending 0000/1111 intentionally decline.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStage('delivery')}><ArrowLeft size={16} className="mr-1" /> Back</Button>
            <Button onClick={continuePayment} size="lg">Review order</Button>
          </div>
        </>
      )}

      {/* REVIEW */}
      {stage === 'review' && (
        <>
          <h1 className="text-2xl font-medium text-ink-900 mb-6">Review your order</h1>

          <div className="space-y-3 mb-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-ink-200 p-4 text-sm">
                <div className="flex items-center gap-3">
                  {item.variant.imageUrl && (
                    <img src={item.variant.imageUrl} alt="" className="w-12 h-12 rounded-lg bg-ink-50 object-contain" />
                  )}
                  <div>
                    <div className="font-medium text-ink-900">{item.product.name}</div>
                    <div className="text-ink-500">Qty {item.quantity} · {formatINR(item.unitPrice)}</div>
                  </div>
                </div>
                <span className="font-medium text-ink-900">{formatINR(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="rounded-2xl border border-ink-200 p-4 mb-6">
            <label className="block text-sm font-medium text-ink-700 mb-2">Coupon code</label>
            <div className="flex gap-2">
              <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="e.g. NOVA10" />
            </div>
            <p className="text-xs text-ink-400 mt-2">Applied and validated at checkout.</p>
          </div>

          <div className="h-px bg-ink-100 mb-6" />

          <div className="rounded-2xl border border-ink-200 p-6 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-600">Subtotal</span><span className="text-ink-900 font-medium">{formatINR(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-ink-600">Delivery</span><span className="text-ink-900">{deliveryFee === 0 ? 'Free' : formatINR(deliveryFee)}</span></div>
            <div className="flex justify-between text-xs text-ink-400">
              <span>Tax & any coupon discount</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="border-t border-ink-100 pt-2 flex justify-between font-semibold">
              <span className="text-ink-900">Total</span>
              <span className="text-ink-900">{formatINR(subtotal + deliveryFee)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStage('payment')}><ArrowLeft size={16} className="mr-1" /> Back</Button>
            <Button onClick={submitOrder} loading={placing} size="lg">Place order · {formatINR(subtotal + deliveryFee)}</Button>
          </div>
        </>
      )}
    </div>
  );
}
