# Nova Store — Architecture

## System Overview

Nova Store is a microservices-based e-commerce platform. Every business domain is
isolated into its own service with its own MySQL schema, exposing a REST API behind a
single API Gateway.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Client (React + Vite)                          │
│                         http://localhost:5173                            │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │  /api/*
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       API Gateway (Express) :8080                       │
│           JWT validation · CORS · Rate limiting · Identity injection     │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┘
   │      │      │      │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│Auth  ││User  ││Prod  ││Inv   ││Cart  ││Order ││Pay   ││Ship  ││Rev   ││Search││Notif │
│:3001 ││:3002 ││:3003 ││:3004 ││:3005 ││:3006 ││:3007 ││:3008 ││:3009 ││:3010 ││:3011 │
└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘
   │       │       │       │       │       │       │       │       │       │       │
   └───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┘
                                         │
                                ┌────────┴────────┐
                                │  MySQL 8.4       │
                                │  nova_user       │
                                │  nova_product    │
                                │  nova_inventory  │
                                │  nova_cart       │
                                │  nova_order      │
                                │  nova_payment    │
                                │  nova_shipping   │
                                │  nova_review     │
                                │  nova_notification│
                                └─────────────────┘
```

## Service Responsibilities

| Service               | Port | Schema              | Responsibility                                              |
|-----------------------|------|----------------------|-------------------------------------------------------------|
| API Gateway           | 8080 | —                    | Entry point, JWT validation, CORS, rate limiting, proxy     |
| Auth Service          | 3001 | `nova_user`          | Registration, login, JWT/cookie management, password reset  |
| User Service          | 3002 | `nova_user`          | Profiles, addresses, admin user management                  |
| Product Service       | 3003 | `nova_product`       | Catalog, categories, promotions, coupons, admin CRUD        |
| Inventory Service     | 3004 | `nova_inventory`     | Stock levels, reservations, movement history                 |
| Cart Service          | 3005 | `nova_cart`          | Guest + authenticated carts, merge on login                 |
| Order Service         | 3006 | `nova_order`         | Checkout orchestration, order lifecycle, cancellation       |
| Payment Service       | 3007 | `nova_payment`       | Payment charging, refund processing (mock provider)         |
| Shipping Service      | 3008 | `nova_shipping`      | Delivery methods, shipments, tracking                       |
| Review Service        | 3009 | `nova_review`        | Product reviews, moderation, helpful votes                  |
| Search Service        | 3010 | `nova_notification`  | Full-text search, suggestions, recent queries               |
| Notification Service  | 3011 | `nova_notification`  | Email + in-app notifications, templates                     |

## Communication Patterns

### Synchronous (REST)

All client → service communication is routed through the API Gateway via HTTP/REST.
Service-to-service calls (e.g., Order → Inventory to reserve stock) also use HTTP.

```
Client → Gateway → Order Service → Product Service  (price validation)
                                → Inventory Service  (reserve stock)
                                → Payment Service    (charge)
                                → Shipping Service   (create shipment)
                                → Notification Service (send emails)
```

### Asynchronous (Event-Driven) — Future

The current implementation uses synchronous orchestration within the Order Service.
In a production build, the following would be event-driven:

| Event                  | Producer           | Consumer(s)                 |
|------------------------|--------------------|-----------------------------|
| `order.placed`         | Order Service      | Inventory, Notification     |
| `order.status_changed` | Order Service      | Notification                |
| `payment.confirmed`    | Payment Service    | Order, Notification         |
| `payment.failed`       | Payment Service    | Order, Notification         |
| `review.created`       | Review Service     | Notification                |
| `stock.low`            | Inventory Service  | Notification (admin)        |

## Port Map

| Service               | Internal | External |
|-----------------------|----------|----------|
| API Gateway           | 8080     | 8080     |
| Auth Service          | 3001     | —        |
| User Service          | 3002     | —        |
| Product Service       | 3003     | —        |
| Inventory Service     | 3004     | —        |
| Cart Service          | 3005     | —        |
| Order Service         | 3006     | —        |
| Payment Service       | 3007     | —        |
| Shipping Service      | 3008     | —        |
| Review Service        | 3009     | —        |
| Search Service        | 3010     | —        |
| Notification Service  | 3011     | —        |
| Client (Vite dev)     | 5173     | 5173     |
| MySQL                 | 3306     | 3306     |
| Nginx (prod)          | 80       | 80       |

Services are **not** directly exposed to the host in Docker — only the Gateway,
Client, and MySQL ports are mapped.

## Tech Stack

| Layer        | Technology                                                      |
|--------------|-----------------------------------------------------------------|
| Frontend     | React 18, React Router 6, TanStack Query, Axios, Tailwind CSS  |
| API Gateway  | Express, Helmet, CORS, cookie-parser, express-rate-limit        |
| Services     | Express, mysql2, bcryptjs, jsonwebtoken, zod, pino              |
| Database     | MySQL 8.4 (single server, schema-per-service)                   |
| Build        | Vite 5, TypeScript (client), Node.js 20                          |
| Infrastructure | Docker, Docker Compose, Nginx                                 |

## Security Model

### Authentication

- **JWT + httpOnly cookies**: On login/refresh, the Auth Service sets two cookies:
  - `nova_access` — short-lived access token (15 min)
  - `nova_refresh` — long-lived refresh token (7 days)
- Cookies are `httpOnly`, `SameSite=Lax`, and `Secure` in production.
- The client never reads tokens directly; Axios sends cookies with `withCredentials: true`.

### Identity Propagation

The API Gateway validates the access JWT and injects identity headers into
downstream service requests:

```
x-user-id:    3
x-user-email: customer@nova.dev
x-user-name:  Rahul Kumar
x-user-role:  CUSTOMER
```

Downstream services use `requireAuth` and `requireRole` from `@nova/shared`,
which read these headers — they **never** verify JWTs themselves.

### Service-to-Service Auth

Internal services accept identity headers from the Gateway. In a production
deployment, a shared secret or mTLS would authenticate gateway → service calls.

### Session Cookies

Guest carts use a `nova_session` cookie containing a random session key.
This is not a security token — it is a lookup key for anonymous cart data.

### Rate Limiting

- **Gateway**: 120 req/min on auth routes, 600 req/min globally.
- **Per-service**: Additional rate limiting for sensitive endpoints.

## Data Ownership Matrix

| Schema             | Owner Service       | Cross-Schema References         |
|--------------------|----------------------|----------------------------------|
| `nova_user`        | Auth + User          | —                                |
| `nova_product`     | Product              | —                                |
| `nova_inventory`   | Inventory            | References `product_variants` IDs (logical, no FK) |
| `nova_cart`        | Cart                 | —                                |
| `nova_order`       | Order                | — (item data is snapshot/copied) |
| `nova_payment`     | Payment              | —                                |
| `nova_shipping`    | Shipping             | —                                |
| `nova_review`      | Review               | — (references product/user IDs logically) |
| `nova_notification`| Notification         | —                                |

Each schema is self-contained. Data that crosses service boundaries is
duplicated at write time (e.g., order items snapshot product data at checkout).

## Scaling Notes

### Horizontal Scaling

All services are stateless (state lives in MySQL). Each can be scaled
independently by running multiple containers behind a load balancer.

### Database

- **Read replicas** for heavy-read services (Product, Search).
- **Connection pooling** via `mysql2` pool per service (configurable pool size).
- Schema-per-service allows migrating to dedicated MySQL instances per domain.

### Stateless Auth

JWT-based auth means any gateway instance can validate requests. Refresh tokens
are stored in `nova_user.refresh_tokens` and can be rotated across instances.

### Cache Layer (Future)

- **Redis** for session store, product caching, search results.
- **CDN** for static product images.
