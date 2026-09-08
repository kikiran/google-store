import { lazy } from 'react';

function lazyPage(factory: () => Promise<{ default: React.ComponentType }>) {
  const Component = lazy(factory) as any;
  return Component;
}

export const pages = {
  HomePage: lazyPage(() => import('../pages/home/HomePage')),
  ProductsPage: lazyPage(() => import('../pages/products/ProductsPage')),
  ProductDetailPage: lazyPage(() => import('../pages/product/ProductDetailPage')),
  SearchPage: lazyPage(() => import('../pages/search/SearchPage')),
  CartPage: lazyPage(() => import('../pages/cart/CartPage')),
  CheckoutPage: lazyPage(() => import('../pages/checkout/CheckoutPage')),
  LoginPage: lazyPage(() => import('../pages/auth/LoginPage')),
  RegisterPage: lazyPage(() => import('../pages/auth/RegisterPage')),
  ForgotPasswordPage: lazyPage(() => import('../pages/auth/ForgotPasswordPage')),
  ResetPasswordPage: lazyPage(() => import('../pages/auth/ResetPasswordPage')),
  AccountPage: lazyPage(() => import('../pages/account/AccountPage')),
  OrdersPage: lazyPage(() => import('../pages/account/OrdersPage')),
  OrderDetailPage: lazyPage(() => import('../pages/account/OrderDetailPage')),
  ProfilePage: lazyPage(() => import('../pages/account/ProfilePage')),
  AddressesPage: lazyPage(() => import('../pages/account/AddressesPage')),
  AdminPage: lazyPage(() => import('../pages/admin/AdminPage')),
  AdminProductsPage: lazyPage(() => import('../pages/admin/AdminProductsPage')),
  AdminCategoriesPage: lazyPage(() => import('../pages/admin/AdminCategoriesPage')),
  AdminOrdersPage: lazyPage(() => import('../pages/admin/AdminOrdersPage')),
  AdminUsersPage: lazyPage(() => import('../pages/admin/AdminUsersPage')),
  AdminInventoryPage: lazyPage(() => import('../pages/admin/AdminInventoryPage')),
  AdminReviewsPage: lazyPage(() => import('../pages/admin/AdminReviewsPage')),
  AdminPromotionsPage: lazyPage(() => import('../pages/admin/AdminPromotionsPage')),
  NotFoundPage: lazyPage(() => import('../pages/NotFoundPage')),
};
