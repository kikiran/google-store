export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Vario {
  id: number;
  sku: string;
  name: string;
  color?: string;
  colorSwatch?: string;
  storage?: string;
  price: number;
  compareAtPrice?: number;
  isDefault?: boolean;
  stock?: {
    quantity: number;
    reservedQuantity: number;
    available: number;
    inStock: boolean;
  };
}

export interface ProductSummary {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  brand: string;
  badge?: string;
  isNew: boolean;
  isFeatured: boolean;
  category: {
    id: number;
    slug: string;
    name: string;
  };
  basePrice: number;
  compareAtPrice?: number;
  images: ProductImage[];
  rating: number;
  reviewCount: number;
  stock: {
    available: number;
    quantity: number;
    inStock: boolean;
  };
}

export interface Promotion {
  id: number;
  name: string;
  slug: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  promoLabel: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  brand: string;
  badge?: string;
  isNew: boolean;
  isFeatured: boolean;
  category: {
    id: number;
    slug: string;
    name: string;
  };
  basePrice: number;
  compareAtPrice?: number;
  images: Array<{ id: number; url: string; alt: string; isPrimary: boolean; sortOrder: number }>;
  variants: Vario[];
  specifications: Array<{ name: string; value: string; sortOrder?: number }>;
  promotions: Promotion[];
  rating: {
    average: number;
    count: number;
    distribution: Record<string, number>;
  };
  related: ProductSummary[];
  stock: {
    available: number;
    quantity: number;
    inStock: boolean;
  };
}

export interface CartItem {
  id: number;
  variantId: number;
  quantity: number;
  unitPrice: number;
  product: { slug: string; name: string };
  variant: {
    name: string;
    color?: string;
    storage?: string;
    sku: string;
    price: number;
    imageUrl?: string;
  };
}

export interface Cart {
  id: number;
  count: number;
  items: CartItem[];
  subtotal: number;
  compareAtSubtotal?: number;
  discount?: number;
}

export interface Address {
  id?: number;
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'MANAGER' | 'ADMIN';
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Profile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Review {
  id: number;
  productId: number;
  userId?: number;
  userName: string;
  rating: number;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  variantId: number;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  productName?: string;
  variantName?: string;
  productSlug?: string;
  sku?: string;
  imageUrl?: string;
  product?: { slug: string; name: string; imageUrl?: string };
  variant?: { name: string; color?: string; storage?: string };
}

export interface StatusEvent {
  fromStatus?: string | null;
  toStatus: string;
  note?: string;
  actorType?: string;
  createdAt?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  payment_status: string;
  customerEmail?: string;
  customerName?: string;
  shippingMethodCode?: string;
  shippingMethodName?: string;
  itemsSubtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency?: string;
  couponCode?: string | null;
  items: OrderItem[];
  statusEvents?: StatusEvent[];
  placedAt: string;
  payment?: unknown;
  shipment?: unknown;
  tracking?: string | null;
  shippingAddress?: Address;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ShippingMethod {
  id: number;
  code: string;
  name: string;
  description?: string;
  fee: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface Coupon {
  code: string;
  discount: number;
  type: string;
  minOrder?: number;
  expiresAt?: string;
}
