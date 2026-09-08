# =====================================================================
# Nova Store — Client (multi-stage)
# Build from repo root: docker build -t nova-client .
# =====================================================================

# ---- stage 1: install dependencies + build ----
FROM node:20-alpine AS client-build

WORKDIR /app

# Copy workspace root manifests first (layer caching: deps change less often)
COPY package.json package-lock.json* ./
COPY shared/package.json shared/
COPY client/package.json client/

# Install every workspace (services/*) so @nova/shared is available.
# This is the safest approach for npm workspaces with cross-workspace deps.
RUN npm install

# Copy the rest of the source
COPY . .

# Build the Vite client
RUN npm run build -w client

# ---- stage 2: production preview / dev server ----
FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=client-build /app/client/dist ./client/dist
COPY --from=client-build /app/client/package.json ./client/
COPY --from=client-build /app/node_modules ./node_modules
COPY --from=client-build /app/package.json ./

EXPOSE 5173

# For production, serve static files with a lightweight server.
# For dev, use docker-compose command override.
CMD ["npx", "serve", "client/dist", "-l", "5173", "-s"]
