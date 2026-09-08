# Nova Store

A production-ready microservices e-commerce platform inspired by the Google Store shopping experience, built with an original brand identity and fully containerized infrastructure.

![Node.js](https://img.shields.io/badge/Node.js-20+-green) ![MySQL](https://img.shields.io/badge/MySQL-8.4-blue) ![Docker](https://img.shields.io/badge/Docker-24-blue) ![React](https://img.shields.io/badge/React-18-61DAFB)

## Overview

Nova Store is a full-stack e-commerce platform where every business domain is isolated into its own microservice with its own MySQL schema. A React client communicates through a single API Gateway that handles authentication, rate limiting, and request routing.

**Key features:**
- 11 backend microservices + API Gateway
- Cookie-based JWT authentication with httpOnly tokens
- Guest and authenticated shopping carts with merge
- Full checkout orchestration (pricing → inventory → payment → shipping)
- Product catalog with categories, variants, promotions, and coupons
- Review moderation system with verified purchase tracking
- Full-text search with suggestions and recent queries
- Admin dashboard (products, orders, users, inventory, reviews, promotions)
- Complete Docker infrastructure for local and production use

## Architecture

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
└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘
                                         │
                                ┌────────┴────────┐
                                │  MySQL 8.4       │
                                │  9 schemas       │
                                └─────────────────┘
```

## Tech Stack

| Layer         | Technology                                                       |
|---------------|------------------------------------------------------------------|
| Frontend      | React 18, React Router 6, TanStack Query, Axios, Tailwind CSS   |
| API Gateway   | Express, Helmet, CORS, cookie-parser, express-rate-limit         |
| Services      | Express, mysql2, bcryptjs, jsonwebtoken, zod, pino               |
| Database      | MySQL 8.4 (schema-per-service)                                   |
| Build         | Vite 5, TypeScript (client), Node.js 20                          |
| Infrastructure| Docker, Docker Compose, Nginx                                    |

## Project Structure

```
nova-store/
├── client/                     # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── pages/              # Page components (lazy-loaded)
│   │   ├── components/         # Shared components (ui/, layout/, admin/)
│   │   ├── context/            # React contexts (Auth, Cart, Toast)
│   │   ├── lib/                # API client, formatters, utilities
│   │   ├── routes/             # Route definitions + guards
│   │   └── types/              # TypeScript interfaces
│   └── public/images/          # Generated SVG product/category images
├── shared/                     # @nova/shared — config, DB, middleware, utils
├── services/
│   ├── api-gateway/            # :8080 — entry point, JWT, CORS, proxy
│   ├── auth-service/           # :3001 — register, login, tokens
│   ├── user-service/           # :3002 — profiles, addresses
│   ├── product-service/        # :3003 — catalog, categories, promotions
│   ├── inventory-service/      # :3004 — stock levels, reservations
│   ├── cart-service/           # :3005 — guest + auth carts
│   ├── order-service/          # :3006 — checkout, order lifecycle
│   ├── payment-service/        # :3007 — mock payments, refunds
│   ├── shipping-service/       # :3008 — delivery methods, tracking
│   ├── review-service/         # :3009 — reviews, moderation
│   ├── search-service/         # :3010 — full-text search
│   └── notification-service/   # :3011 — email + in-app notifications
├── infrastructure/
│   ├── mysql/
│   │   ├── init.sql            # Schema + table creation
│   │   └── seed.sql            # Demo data
│   ├── docker/
│   │   └── Dockerfile.service  # Generic backend service Dockerfile
│   ├── nginx/
│   │   └── nginx.conf          # Production reverse proxy
│   └── scripts/                # DB init, seed, asset generation
├── docs/
│   ├── API_SPEC.md             # Full API specification
│   ├── ARCHITECTURE.md         # System design + diagrams
│   ├── ER-DIAGRAM.md           # Database ER diagram
│   ├── FRONTEND.md             # Client architecture
│   ├── PROJECT_ROADMAP.md      # Development phases
│   └── nova-store-api.postman_collection.json
├── Dockerfile                  # Multi-stage client build
├── docker-compose.yml          # Full stack orchestration
├── package.json                # npm workspaces root
└── .env.example                # Environment template
```

## Prerequisites

- **Node.js** 20+ and npm 9+ (for workspaces)
- **MySQL** 8.4+ (local or Docker)
- **Docker** + Docker Compose v2 (optional, for containerized setup)

## Quick Start (Local without Docker)

```bash
# 1. Clone the repository
git clone https://github.com/kikiran/google-store.git
cd google-store

# 2. Install dependencies (all workspaces)
npm install

# 3. Copy and configure environment
cp .env.example .env
# Edit .env — set DB_HOST, DB_USER, DB_PASSWORD for your local MySQL

# 4. Initialize database + seed demo data
npm run db:setup

# 5. Generate SVG product images
node infrastructure/scripts/generate-assets.mjs

# 6. Start all services + client
npm run dev
```

Services start on ports 8080–3011, client on **http://localhost:5173**.

### Demo Credentials

| Role     | Email               | Password        |
|----------|---------------------|-----------------|
| Admin    | admin@nova.dev      | NovaAdmin123!   |
| Manager  | manager@nova.dev    | NovaManager123! |
| Customer | customer@nova.dev   | Customer123!    |

## Quick Start (Docker)

```bash
# 1. Clone and configure
git clone https://github.com/kikiran/google-store.git
cd google-store
cp .env.example .env

# 2. Start everything (MySQL, all services, client)
docker compose up

# 3. (Optional) Production mode with Nginx
docker compose --profile prod up
```

The first build takes a few minutes (npm install + Vite build). Subsequent
starts use Docker layer caching and are much faster.

```bash
# Rebuild after code changes
docker compose build
docker compose up

# Stop and remove volumes
docker compose down -v

# View logs
docker compose logs -f api-gateway
docker compose logs -f auth-service
```

## Microservice Ports

| Service              | Port  | Description                        |
|----------------------|-------|------------------------------------|
| API Gateway          | 8080  | Entry point — all traffic goes here|
| Auth Service         | 3001  | Authentication & token management  |
| User Service         | 3002  | User profiles & addresses          |
| Product Service      | 3003  | Product catalog & categories       |
| Inventory Service    | 3004  | Stock levels & reservations        |
| Cart Service         | 3005  | Shopping cart management           |
| Order Service        | 3006  | Checkout & order lifecycle         |
| Payment Service      | 3007  | Payment processing (mock)          |
| Shipping Service     | 3008  | Delivery methods & tracking        |
| Review Service       | 3009  | Product reviews & moderation       |
| Search Service       | 3010  | Full-text search & suggestions     |
| Notification Service | 3011  | Email & in-app notifications       |
| Client (Vite)        | 5173  | React frontend                     |
| MySQL                | 3306  | Database server                    |

## API Documentation

The full API specification is in [`docs/API_SPEC.md`](docs/API_SPEC.md).

A complete Postman collection is available at
[`docs/nova-store-api.postman_collection.json`](docs/nova-store-api.postman_collection.json).
Import it into Postman or Insomnia to explore every endpoint.

### Auth Flow

```
1. POST /api/auth/register   → Creates user, sets nova_access + nova_refresh cookies
2. POST /api/auth/login      → Validates credentials, sets cookies
3. GET  /api/auth/me          → Returns current user (reads nova_access cookie)
4. POST /api/auth/refresh     → Rotates tokens (reads nova_refresh cookie)
5. POST /api/auth/logout      → Revokes refresh token, clears cookies
```

The API Gateway validates the `nova_access` cookie and injects identity headers
(`x-user-id`, `x-user-email`, `x-user-role`) into downstream service requests.
The client never reads tokens directly.

### Checkout Flow

```
1. POST /api/orders (checkout request)
   │
   ├─→ Product Service:    validate + re-price items from catalog
   ├─→ Inventory Service:  reserve stock (transactional)
   ├─→ Order Service:      persist order (PENDING)
   ├─→ Payment Service:    charge payment (mock auto-confirms)
   ├─→ Shipping Service:   create shipment
   └─→ Notification Service: send confirmation emails
```

All orchestration happens within the Order Service. Each step is independent
and can be replaced with event-driven messaging in production.

## Docker Usage

### Building Images

```bash
# Build client image (multi-stage)
docker build -t nova-client .

# Build a specific service (uses infrastructure/docker/Dockerfile.service)
docker build --build-arg SERVICE=auth-service \
  -f infrastructure/docker/Dockerfile.service \
  -t nova-auth-service .
```

### Docker Compose Commands

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Rebuild without cache
docker compose build --no-cache

# View service logs
docker compose logs -f [service-name]

# Execute into a running container
docker compose exec auth-service sh

# Run DB scripts inside a container
docker compose exec mysql mysql -u nova -pnova_secret nova_user
```

## Postman Collection

Import `docs/nova-store-api.postman_collection.json` into Postman:

1. Open Postman → Import → Upload Files
2. Select the JSON file
3. The `baseUrl` variable defaults to `http://localhost:8080`
4. Use the **Login** request first — cookies are stored automatically
5. All subsequent requests inherit the auth cookies

The collection covers every endpoint in `API_SPEC.md` organized by domain
folders: Auth, Users, Products, Cart, Orders, Payments, Shipping, Reviews,
Search, Notifications, and Admin sections.

## Production Considerations

- [ ] **HTTPS**: Configure TLS termination (Nginx + certificates or cloud LB)
- [ ] **Secrets**: Use a secrets manager (Vault, AWS Secrets Manager) — never commit `.env`
- [ ] **JWT secrets**: Generate strong secrets: `openssl rand -hex 64`
- [ ] **CORS**: Restrict `CORS_ORIGINS` to your production domain
- [ ] **Database**: Use dedicated MySQL instances per schema for high traffic
- [ ] **Cache**: Add Redis for product listings and session storage
- [ ] **Monitoring**: Set up Prometheus + Grafana or equivalent
- [ ] **Logging**: Configure structured log aggregation
- [ ] **Backups**: Schedule MySQL backups with point-in-time recovery
- [ ] **Rate limiting**: Tune limits per service for production traffic

## Troubleshooting

### MySQL connection refused

```bash
# Check if MySQL is running
docker compose ps mysql

# Wait for healthcheck to pass
docker compose logs mysql | grep "ready for connections"
```

### Port already in use

```bash
# Find what's using the port (Windows)
netstat -ano | findstr :8080

# Or change ports in .env / docker-compose.yml
```

### CORS errors

Ensure `CORS_ORIGINS` in `.env` includes your client URL:
```
CORS_ORIGINS=http://localhost:5173,http://localhost:80
```

### Services can't connect to MySQL

When running outside Docker, services use `DB_HOST=localhost`. When running
in Docker, the `docker-compose.yml` overrides `DB_HOST=mysql` (the container
name). Make sure your `.env` is correct for your setup.

### Docker build fails

```bash
# Clear Docker build cache
docker compose build --no-cache

# Ensure package-lock.json exists (needed for npm ci)
npm install --package-lock-only
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
