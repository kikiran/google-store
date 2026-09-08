# Nova Store — Frontend Architecture

## Overview

The client is a single-page application built with React 18, TypeScript,
React Router 6, TanStack Query, and Tailwind CSS. It communicates with the
backend exclusively through the API Gateway at `/api`.

## Directory Structure

```
client/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── public/
│   └── images/
│       ├── products/          # Product SVG illustrations
│       └── categories/        # Category tile SVGs
└── src/
    ├── main.tsx               # React root + providers
    ├── App.tsx                # Route definitions
    ├── index.css              # Tailwind directives + global styles
    ├── types/
    │   └── index.ts           # Shared TypeScript interfaces
    ├── lib/
    │   ├── api.ts             # Axios instance + interceptors
    │   ├── format.ts          # Currency / date formatting
    │   ├── query.ts           # TanStack Query client config
    │   └── seo.ts             # Dynamic <title> / meta
    ├── context/
    │   ├── AuthContext.tsx     # Authentication state + actions
    │   ├── CartContext.tsx     # Cart state + mutations
    │   └── ToastContext.tsx    # Toast notification system
    ├── routes/
    │   ├── auth.tsx           # RequireAuth, RequireRole guards
    │   └── lazy.ts            # Lazy-loaded page imports
    ├── components/
    │   ├── ui/                # Reusable UI primitives (Button, Skeleton, Modal…)
    │   ├── layout/            # Layout shell (Header, Footer, Sidebar)
    │   ├── admin/             # AdminShell (sidebar + topbar for /admin/*)
    │   └── product/           # ProductCard, VariantPicker, ImageGallery
    └── pages/
        ├── home/HomePage
        ├── products/ProductsPage
        ├── product/ProductDetailPage
        ├── search/SearchPage
        ├── cart/CartPage
        ├── checkout/CheckoutPage
        ├── auth/
        │   ├── LoginPage
        │   ├── RegisterPage
        │   ├── ForgotPasswordPage
        │   └── ResetPasswordPage
        ├── account/
        │   ├── AccountPage
        │   ├── OrdersPage
        │   ├── OrderDetailPage
        │   ├── ProfilePage
        │   └── AddressesPage
        ├── admin/
        │   ├── AdminPage
        │   ├── AdminProductsPage
        │   ├── AdminCategoriesPage
        │   ├── AdminOrdersPage
        │   ├── AdminUsersPage
        │   ├── AdminInventoryPage
        │   ├── AdminReviewsPage
        │   └── AdminPromotionsPage
        └── NotFoundPage
```

## Routing Table

All public-facing routes are nested inside `<Layout />` which provides the
header, footer, and content area.

### Public Routes

| Path                    | Page                  | Auth    |
|-------------------------|-----------------------|---------|
| `/`                     | HomePage              | Public  |
| `/products`             | ProductsPage          | Public  |
| `/products/:category`   | ProductsPage (filter) | Public  |
| `/product/:slug`        | ProductDetailPage     | Public  |
| `/search`               | SearchPage            | Public  |
| `/cart`                 | CartPage              | Public  |
| `/login`                | LoginPage             | Public  |
| `/register`             | RegisterPage          | Public  |
| `/forgot-password`      | ForgotPasswordPage    | Public  |
| `/reset-password`       | ResetPasswordPage     | Public  |

### Authenticated Routes (CUSTOMER / MANAGER / ADMIN)

| Path                        | Page              | Auth   |
|-----------------------------|-------------------|--------|
| `/checkout`                 | CheckoutPage      | User   |
| `/account`                  | AccountPage       | User   |
| `/account/orders`           | OrdersPage        | User   |
| `/account/orders/:number`   | OrderDetailPage   | User   |
| `/account/profile`          | ProfilePage       | User   |
| `/account/addresses`        | AddressesPage     | User   |

### Admin Routes (ADMIN / MANAGER only)

| Path                       | Page                | Auth     |
|----------------------------|---------------------|----------|
| `/admin`                   | AdminPage (dashboard)| Admin   |
| `/admin/products`          | AdminProductsPage    | Admin   |
| `/admin/products/:id/edit` | AdminProductsPage    | Admin   |
| `/admin/categories`        | AdminCategoriesPage  | Admin   |
| `/admin/orders`            | AdminOrdersPage      | Admin   |
| `/admin/users`             | AdminUsersPage       | Admin   |
| `/admin/inventory`         | AdminInventoryPage   | Admin   |
| `/admin/reviews`           | AdminReviewsPage     | Admin   |
| `/admin/promotions`        | AdminPromotionsPage  | Admin   |

All admin routes are wrapped in `<RequireAuth>` + `<RequireRole>` guards and
rendered inside the `<AdminShell>` layout (sidebar navigation).

## Component Inventory

### Layout Components

| Component        | Path                         | Description                              |
|------------------|------------------------------|------------------------------------------|
| `Layout`         | `components/layout/Layout`   | Full page shell: header + main + footer  |
| `Header`         | `components/layout/Header`   | Logo, nav links, search, cart icon, user |
| `Footer`         | `components/layout/Footer`   | Links, brand info                        |
| `AdminShell`     | `components/admin/AdminShell`| Sidebar + topbar for admin area          |

### UI Primitives

| Component      | Description                            |
|----------------|----------------------------------------|
| `Button`       | Primary, secondary, ghost variants     |
| `Skeleton`     | Loading placeholders including `PageSkeleton` |
| `Modal`        | Overlay dialog                         |
| `Toast`        | In-app notification toasts             |
| `Input`        | Form input with label + error state    |
| `Select`       | Dropdown select                        |
| `Badge`        | Status/count badges                    |
| `Pagination`   | Page navigation                        |
| `Spinner`      | Loading indicator                      |
| `StarRating`   | Interactive star display/input         |

### Domain Components

| Component        | Description                                    |
|------------------|------------------------------------------------|
| `ProductCard`    | Product tile (image, name, price, rating)      |
| `VariantPicker` | Color/storage selector on product detail       |
| `ImageGallery`   | Product image carousel with thumbnails         |
| `CartItem`       | Cart row (image, variant, quantity, price)     |
| `OrderCard`      | Order summary in history list                  |
| `AddressCard`    | Address display with edit/delete actions       |
| `ReviewCard`     | Review display with helpful button             |

## State Management

The app uses three complementary patterns:

### 1. React Context (Global State)

| Context          | Purpose                                         |
|------------------|-------------------------------------------------|
| `AuthContext`    | Current user, login/register/logout actions     |
| `CartContext`    | Cart data, add/update/remove/clear mutations    |
| `ToastContext`   | Toast notification queue                        |

`CartContext` integrates with TanStack Query for cache invalidation on mutation.

### 2. TanStack Query (Server State)

All API data is fetched via `useQuery` and mutated via `useMutation`:

```typescript
// Example: product listing
const { data, isLoading } = useQuery({
  queryKey: ['products', { category, sort, page }],
  queryFn: () => api.get('/products', { params: { category, sort, page } }),
});
```

Mutations automatically invalidate related queries:

```typescript
const addItem = useMutation({
  mutationFn: (payload) => api.post('/cart/items', payload),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
});
```

### 3. URL State

Filter, sort, and pagination parameters are stored in URL search params via
React Router's `useSearchParams`. This makes product listing URLs shareable.

## API Integration

### Axios Configuration (`lib/api.ts`)

- **Base URL**: `/api` (proxied by Vite in dev, by Nginx in prod)
- **Credentials**: `withCredentials: true` for cookie-based auth
- **Auto-refresh**: On 401, attempts token refresh before retrying
- **Guest sessions**: `sessionKey` param appended to cart requests
- **Unauthorized event**: Dispatches `nova:unauthorized` custom event → clears user state

### Data Fetching Pattern

```
Component → useQuery(key, apiCall) → Render data / Loading skeleton / Error state
```

### Mutation Pattern

```
User action → useMutation(apiCall) → Invalidate query → Refetch → Update UI
```

## Responsive Design

Built with Tailwind CSS utility classes and a mobile-first approach.

### Breakpoints

| Breakpoint | Width   | Layout                                         |
|------------|---------|------------------------------------------------|
| `sm`       | 640px   | Single column, stacked nav                     |
| `md`       | 768px   | Two-column product grid                        |
| `lg`       | 1024px  | Sidebar visible, three-column product grid     |
| `xl`       | 1280px  | Full layout, four-column product grid          |

### Key Responsive Patterns

- **Header**: Hamburger menu on mobile, horizontal nav on desktop
- **Product grid**: 1 col → 2 cols → 3 cols → 4 cols
- **Product detail**: Stacked layout on mobile, side-by-side gallery+info on desktop
- **Cart**: Full-width on mobile, sidebar summary on desktop
- **Admin**: Collapsible sidebar, hidden on mobile with overlay toggle

## Code Splitting

Every page is lazy-loaded via `React.lazy()` through the `routes/lazy.ts`
module. The main bundle includes only:
- `App.tsx` (route definitions)
- Layout components
- Context providers
- UI primitives

Heavy pages (Admin, Checkout, ProductDetail) load on demand.

## SEO

`lib/seo.ts` provides a `useSEO` hook that dynamically updates:
- `<title>` tag
- Meta description
- Open Graph tags (where applicable)

All pages use this for consistent, crawlable metadata.
