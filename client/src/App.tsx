import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RequireAuth, RequireRole } from '@/routes/auth';
import { pages } from '@/routes/lazy';
import { PageSkeleton } from '@/components/ui/Skeleton';
import Layout from '@/components/layout/Layout';

const AdminShell = lazy(() => import('@/components/admin/AdminShell'));

export default function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<pages.HomePage />} />
          <Route path="/products" element={<pages.ProductsPage />} />
          <Route path="/products/:category" element={<pages.ProductsPage />} />
          <Route path="/product/:slug" element={<pages.ProductDetailPage />} />
          <Route path="/search" element={<pages.SearchPage />} />
          <Route path="/cart" element={<pages.CartPage />} />
          <Route path="/checkout" element={<pages.CheckoutPage />} />
          <Route path="/login" element={<pages.LoginPage />} />
          <Route path="/register" element={<pages.RegisterPage />} />
          <Route path="/forgot-password" element={<pages.ForgotPasswordPage />} />
          <Route path="/reset-password" element={<pages.ResetPasswordPage />} />

          <Route element={<RequireAuth><RequireRole roles={['CUSTOMER', 'MANAGER', 'ADMIN']} /></RequireAuth>}>
            <Route path="/account" element={<pages.AccountPage />} />
            <Route path="/account/orders" element={<pages.OrdersPage />} />
            <Route path="/account/orders/:orderNumber" element={<pages.OrderDetailPage />} />
            <Route path="/account/profile" element={<pages.ProfilePage />} />
            <Route path="/account/addresses" element={<pages.AddressesPage />} />
          </Route>

          <Route element={<RequireAuth><RequireRole roles={['ADMIN', 'MANAGER']} /></RequireAuth>}>
            <Route element={<Suspense fallback={<PageSkeleton />}><AdminShell /></Suspense>}>
              <Route path="/admin" element={<pages.AdminPage />} />
              <Route path="/admin/products" element={<pages.AdminProductsPage />} />
              <Route path="/admin/products/:id/edit" element={<pages.AdminProductsPage />} />
              <Route path="/admin/categories" element={<pages.AdminCategoriesPage />} />
              <Route path="/admin/orders" element={<pages.AdminOrdersPage />} />
              <Route path="/admin/users" element={<pages.AdminUsersPage />} />
              <Route path="/admin/inventory" element={<pages.AdminInventoryPage />} />
              <Route path="/admin/reviews" element={<pages.AdminReviewsPage />} />
              <Route path="/admin/promotions" element={<pages.AdminPromotionsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<pages.NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
