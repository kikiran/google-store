import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Cart } from '@/types';

function getGuestSession(): string {
  let sk = localStorage.getItem('nova_guest_session');
  if (!sk) {
    sk = 'sess_' + crypto.randomUUID();
    localStorage.setItem('nova_guest_session', sk);
  }
  return sk;
}

interface CartCtx {
  cart: Cart | null;
  count: number;
  isLoading: boolean;
  refetch: () => void;
  addItem: (variantId: number, quantity?: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  removeItem: (itemId: number) => void;
  clear: () => void;
  mergeGuestCart: () => Promise<void>;
}

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [guestSessionKey] = useState(() => getGuestSession());

  useEffect(() => {
    document.cookie = `nova_session=${guestSessionKey};path=/;max-age=31536000`;
  }, [guestSessionKey]);

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await api.get('/cart', { params: { sessionKey: guestSessionKey } });
      return res.data.data;
    },
    staleTime: 30_000,
  });

  const addItem = useMutation({
    mutationFn: (payload: { variantId: number; quantity: number }) =>
      api.post('/cart/items', payload, { params: { sessionKey: guestSessionKey } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const updateQuantity = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      api.patch(`/cart/items/${itemId}`, { quantity }, { params: { sessionKey: guestSessionKey } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: number) =>
      api.delete(`/cart/items/${itemId}`, { params: { sessionKey: guestSessionKey } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const clearCart = useMutation({
    mutationFn: () => api.delete('/cart', { params: { sessionKey: guestSessionKey } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const mergeGuestCart = useCallback(async () => {
    if (!isAuthenticated) return;
    const sk = localStorage.getItem('nova_guest_session');
    if (sk) {
      try {
        await api.post('/cart/merge', null, { params: { sessionKey: sk } });
        localStorage.removeItem('nova_guest_session');
        await queryClient.invalidateQueries({ queryKey: ['cart'] });
      } catch { /* ignore merge errors */ }
    }
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    if (isAuthenticated) {
      mergeGuestCart();
    }
  }, [isAuthenticated, mergeGuestCart]);

  return (
    <CartContext.Provider
      value={{
        cart: cart ?? null,
        count: cart?.count ?? 0,
        isLoading,
        refetch: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
        addItem: (variantId, quantity = 1) => addItem.mutate({ variantId, quantity }),
        updateQuantity: (itemId, quantity) => updateQuantity.mutate({ itemId, quantity }),
        removeItem: (itemId) => removeItem.mutate(itemId),
        clear: () => clearCart.mutate(),
        mergeGuestCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
