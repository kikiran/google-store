# Nova Store — API Specification

All public endpoints live behind the **API Gateway** at `http://localhost:8080` (prefix `/api`).
Services are **never** called directly by the browser.

Response envelope:

```json
{ "success": true, "data": { }, "message": "OK" }
{ "success": false, "error": { "code": "PRODUCT_NOT_FOUND", "message": "..." } }
```

## Identity propagation

The Gateway validates the access JWT and injects these headers into downstream services:

- `x-user-id`
- `x-user-email`
- `x-user-name`
- `x-user-role` (`CUSTOMER`, `MANAGER`, `ADMIN`)

Downstream services use `requireAuth` / `requireRole` from `@nova/shared`, which read these headers.

## Auth

| Method | Route            | Auth  | Description                       |
|--------|------------------|-------|-----------------------------------|
| POST   | /api/auth/register |      | Register. Body: `{firstName,lastName,email,password}` |
| POST   | /api/auth/login    |      | Login. Body: `{email,password}`   |
| POST   | /api/auth/logout   | All  | Revokes refresh token + clears cookie |
| POST   | /api/auth/refresh  |      | Rotates access + refresh tokens (cookie based) |
| GET    | /api/auth/me       | User | Returns current user              |
| POST   | /api/auth/forgot-password | | Body: `{email}`               |
| POST   | /api/auth/reset-password  | | Body: `{token,password}`     |
| GET    | /api/auth/verify-email    | | Query `?token=`               |

Login/refresh set httpOnly cookies `nova_access`, `nova_refresh`.
Guest cart session uses cookie `nova_session`.

## Users

| Method | Route                        | Auth   | Description |
|--------|------------------------------|--------|-------------|
| GET    | /api/users/me                | User   | Profile + preferences |
| PATCH  | /api/users/me                | User   | `{firstName,lastName,phone,avatarUrl}` |
| GET    | /api/users/me/addresses      | User   | List      |
| POST   | /api/users/me/addresses      | User   | Create    |
| PUT    | /api/users/me/addresses/:id  | User   | Update    |
| DELETE | /api/users/me/addresses/:id  | User   | Delete    |
| PUT    | /api/users/me/addresses/:id/default | User | Mark default |
| GET    | /api/admin/users             | ADMIN  | Paginated |
| PATCH  | /api/admin/users/:id/role    | ADMIN  | Change role |

Address shape: `{label, fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault}`

## Products

| Method | Route                       | Auth   | Description |
|--------|-----------------------------|--------|-------------|
| GET    | /api/products               |        | List with `page`, `limit`, `category`, `sort`, filters |
| GET    | /api/products/:slug         |        | Detail incl. variants, images, specs, reviews summary, stock |
| GET    | /api/products/:id/related   |        | Related products |
| GET    | /api/categories             |        | All categories |
| GET    | /api/categories/:slug       |        | Category + products |
| GET    | /api/promotions             |        | Active promotions |
| POST   | /api/admin/products         | ADMIN/MANAGER | Create (with variants, images, specs) |
| PATCH  | /api/admin/products/:id     | ADMIN/MANAGER | Update product/variants |
| DELETE | /api/admin/products/:id     | ADMIN/MANAGER | Soft delete |
| POST   | /api/admin/categories       | ADMIN/MANAGER | Create category |
| PATCH  | /api/admin/categories/:id   | ADMIN/MANAGER | Update |
| DELETE | /api/admin/categories/:id   | ADMIN/MANAGER | Delete |
| POST   | /api/admin/promotions       | ADMIN/MANAGER | Create promotion |
| PATCH  | /api/admin/promotions/:id   | ADMIN/MANAGER | Update |
| DELETE | /api/admin/promotions/:id   | ADMIN/MANAGER | Delete |

Products list query:
- `category=phones`
- `sort=featured|price_asc|price_desc|newest|rating|popular`
- `minPrice` / `maxPrice`
- `q` (keyword, forwarded to search when provided)
- `ratings=4` (minimum)
- `availability=in_stock|out_of_stock`
- `page` (default 1), `limit` (default 24)

Product type: `{ id, slug, name, tagline, description, brand, badge, isNew, isFeatured, category:{id,slug,name}, basePrice, compareAtPrice, rating, reviewCount, stock, images:[{url,alt}], variants:[{id,sku,name,color,colorSwatch,storage,price,compareAtPrice,stock}] }`

Detail adds: `specifications:[{name,value}]`, `promotions[...]`, `rating:{average,count,distribution}` (rating summary), `related`, `status`, `featureRank`.

## Cart

| Method | Route                     | Auth         | Description |
|--------|---------------------------|--------------|-------------|
| GET    | /api/cart                 | User/guest   | Cart + items |
| POST   | /api/cart/items           | User/guest   | `{variantId, quantity}` |
| PATCH  | /api/cart/items/:id       | User/guest   | `{quantity}` |
| DELETE | /api/cart/items/:id       | User/guest   | Remove |
| DELETE | /api/cart                 | User/guest   | Clear |
| POST   | /api/cart/merge           | User         | Merge guest cart into user cart |
| GET    | /api/cart/count           | User/guest   | `{count}` |

Cart shapes returned to client: `{ id, count, items:[{id,variantId,quantity,unitPrice,product:{slug,name},variant:{name,color,storage,sku,price,imageUrl}}], subtotal, compareAtSubtotal, discount }`.

## Orders

| Method | Route                    | Auth   | Description |
|--------|--------------------------|--------|-------------|
| POST   | /api/orders              | User/guest | Create order (checkout) |
| GET    | /api/orders/mine         | User   | Order history |
| GET    | /api/orders/:orderNumber | User/guest | Order detail |
| POST   | /api/orders/:orderNumber/cancel | User | Cancel (releases inventory, refunds) |
| POST   | /api/orders/:orderNumber/confirm-payment | User/guest | Confirm mock payment |
| GET    | /api/admin/orders        | ADMIN/MANAGER | Paginated list |
| PATCH  | /api/admin/orders/:id/status | ADMIN/MANAGER | `{status}` + optional note |

Checkout request body:

```json
{
  "email": "customer@x.com",
  "name": "Jane Doe",
  "shippingAddress": { "..." },
  "billingAddress": { "..." },
  "deliveryMethod": "standard",
  "couponCode": "NOVA10",
  "payment": { "method": "mock", "card": { "number": "...", "expiry": "12/30", "cvv": "123" } },
  "items": [ { "variantId": 1, "quantity": 1 } ]
}
```

Order creation orchestrates:
1. Validate + price via product service (prices re-snapped from catalog)
2. Reserve stock via inventory service (transactional)
3. Persist order (PENDING)
4. Charge payment via payment service (mock auto-confirms)
5. Create shipment via shipping service
6. Send notifications

## Payments

| Method | Route                    | Auth | Description |
|--------|--------------------------|------|-------------|
| POST   | /api/payments/charge     |      | Mock charge. Body `{orderId, method, card}` |
| GET    | /api/payments/:id        |      | Payment status |
| POST   | /api/payments/:id/refund | ADMIN | Refund |

## Shipping

| Method | Route                    | Auth | Description |
|--------|--------------------------|------|-------------|
| GET    | /api/shipping/methods    |      | Delivery options |
| GET    | /api/shipping/shipments/:trackingNumber | | Track (uses order-level access enforced by order service display) |

## Reviews

| Method | Route                         | Auth | Description |
|--------|-------------------------------|------|-------------|
| GET    | /api/reviews?productId=&page= |      | Approved reviews (paginated) |
| GET    | /api/reviews/summary?productId= |    | `{average,count,distribution}` |
| POST   | /api/reviews                  | User | `{productId, rating, title, body}` (verified if purchased) |
| POST   | /api/reviews/:id/helpful      | User | Toggle helpful |
| GET    | /api/admin/reviews            | ADMIN/MANAGER | Moderation queue |
| PATCH  | /api/admin/reviews/:id        | ADMIN/MANAGER | `{status}` approve/reject |

Review: `{ id, productId, userId, userName, rating, title, body, isVerifiedPurchase, createdAt, helpfulCount }`

## Search

| Method | Route                     | Auth | Description |
|--------|---------------------------|------|-------------|
| GET    | /api/search?q=            |      | Results (products, paginated) |
| GET    | /api/search/suggestions?q=|      | Suggestions |
| POST   | /api/search/recent        |      | Record query `{q}` |
| GET    | /api/search/recent        |      | Recent queries |

## Inventory (admin)

| Method | Route                               | Auth | Description |
|--------|-------------------------------------|------|-------------|
| GET    | /api/admin/inventory?page=          | ADMIN/MANAGER | List w/ product info |
| PATCH  | /api/admin/inventory/variants/:id   | ADMIN/MANAGER | `{quantity, lowStockThreshold}` |
| GET    | /api/inventory/variants/:id         | public | Simple stock check (internal use) |

## Notifications

| Method | Route                      | Auth | Description |
|--------|----------------------------|------|-------------|
| GET    | /api/notifications         | User | In-app notifications |
| PATCH  | /api/notifications/:id/read | User | Mark read |
| POST   | /api/notifications/send    | internal (service token) | Send email (abstraction) |

## Error codes

`VALIDATION_ERROR`, `UNAUTHORIZED`, `UNAUTHENTICATED`, `INSUFFICIENT_ROLE`, `NOT_FOUND`,
`PRODUCT_NOT_FOUND`, `VARIANT_NOT_FOUND`, `OUT_OF_STOCK`, `INSUFFICIENT_STOCK`,
`CART_EMPTY`, `COUPON_INVALID`, `COUPON_EXPIRED`, `ORDER_NOT_FOUND`,
`ORDER_NOT_CANCELLABLE`, `PAYMENT_FAILED`, `DUPLICATE_RESOURCE`, `TOO_MANY_REQUESTS`.

## HTTP status codes

200 success · 201 created · 204 no content · 400 validation/bad request · 401 unauthenticated ·
403 forbidden · 404 not found · 409 conflict/duplicate · 422 unprocessable · 429 rate limited · 500 error