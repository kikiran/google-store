/**
 * Generates Kubernetes manifests for the Nova Store stack under ./k8s.
 * Run from repo root:  node infrastructure/scripts/generate-k8s.mjs [acrName] [imageTag]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'k8s');
const registry = process.argv[2] || 'novastoreacr.azurecr.io';
const imageTag = process.argv[3] || 'latest';

const NS = 'nova-store';
const image = (app) => `${registry}/nova/${app}:${imageTag}`;

const APPS = [
  { app: 'api-gateway', port: 8080, envVar: 'PORT_GATEWAY', replicas: 2 },
  { app: 'auth-service', port: 3001, envVar: 'PORT_AUTH' },
  { app: 'user-service', port: 3002, envVar: 'PORT_USER' },
  { app: 'product-service', port: 3003, envVar: 'PORT_PRODUCT', replicas: 2 },
  { app: 'inventory-service', port: 3004, envVar: 'PORT_INVENTORY' },
  { app: 'cart-service', port: 3005, envVar: 'PORT_CART' },
  { app: 'order-service', port: 3006, envVar: 'PORT_ORDER' },
  { app: 'payment-service', port: 3007, envVar: 'PORT_PAYMENT' },
  { app: 'shipping-service', port: 3008, envVar: 'PORT_SHIPPING' },
  { app: 'review-service', port: 3009, envVar: 'PORT_REVIEW' },
  { app: 'search-service', port: 3010, envVar: 'PORT_SEARCH' },
  { app: 'notification-service', port: 3011, envVar: 'PORT_NOTIFICATION' },
];

const SERVICE_URLS = APPS.filter((a) => a.app !== 'api-gateway')
  .map((a) => `${a.envVar.replace('PORT_', '')}_SERVICE_URL: http://${a.app}:${a.port}`)
  .join('\n');

const SCHEMAS = [
  'DB_USER_SCHEMA: nova_user',
  'DB_PRODUCT_SCHEMA: nova_product',
  'DB_INVENTORY_SCHEMA: nova_inventory',
  'DB_CART_SCHEMA: nova_cart',
  'DB_ORDER_SCHEMA: nova_order',
  'DB_PAYMENT_SCHEMA: nova_payment',
  'DB_SHIPPING_SCHEMA: nova_shipping',
  'DB_REVIEW_SCHEMA: nova_review',
  'DB_NOTIFICATION_SCHEMA: nova_notification',
].join('\n');

fs.mkdirSync(outDir, { recursive: true });

const write = (name, content) => {
  fs.writeFileSync(path.join(outDir, name), content);
  console.log(`  k8s/${name}`);
};

// ---------------- namespace ----------------
write('00-namespace.yaml', `apiVersion: v1
kind: Namespace
metadata:
  name: ${NS}
`);

// ---------------- configmap ----------------
write('01-configmap.yaml', `# Shared non-secret configuration for all Nova Store pods.
# Update DB_HOST / DB_USER / CORS_ORIGINS to your environment before applying.
apiVersion: v1
kind: ConfigMap
metadata:
  name: nova-store-config
  namespace: ${NS}
data:
  NODE_ENV: production
  LOG_LEVEL: info

  # --- MySQL (use your Azure Database for MySQL flexible server) ---
  DB_HOST: nova-server.mysql.database.azure.com
  DB_PORT: "3306"
  DB_USER: admin
  DB_SSL: "true"
  DB_SSL_INSECURE: "true"
  DB_ALLOW_PUBLIC_KEY: "false"
  # One logical schema per service:
${SCHEMAS.split('\n').map((s) => `  ${s}`).join('\n')}

  # --- JWT / cookies ---
  JWT_ACCESS_TTL: 15m
  JWT_REFRESH_TTL: 7d
  JWT_ISSUER: nova-store
  COOKIE_SECURE: "true"

  # --- Mock payment provider ---
  MOCK_PAYMENT_PROVIDER: success

  # --- CORS (replace with your public ingress host) ---
  CORS_ORIGINS: http://localhost,http://localhost:5173

  # --- Internal service URLs (cluster DNS) ---
${SERVICE_URLS.split('\n').map((s) => `  ${s}`).join('\n')}
`);

// ---------------- secret (placeholders) ----------------
write('02-secret.yaml', `# Sensitive runtime settings. Change every value before real use.
# Values are loaded into every pod via envFrom. Never commit real secrets;
# for production prefer external-secrets / Azure Key Vault provider.
apiVersion: v1
kind: Secret
metadata:
  name: nova-store-secrets
  namespace: ${NS}
type: Opaque
stringData:
  DB_PASSWORD: "CHANGE_ME_DB_PASSWORD"
  JWT_ACCESS_SECRET: "dev_access_secret_change_me"
  JWT_REFRESH_SECRET: "dev_refresh_secret_change_me"
  COOKIE_SECRET: "dev_cookie_secret_change_me"
  SERVICE_TOKEN: "nova-internal"
`);

// ---------------- deployments ----------------
// Note: no .yaml extension so `kubectl apply -f k8s/` ignores this example.
write('03-acr-pull-secret.example', `# One time per namespace. Create with your ACR service-principal credentials:
#   kubectl create secret docker-registry acr-secret \\
#     --docker-server=${registry} --docker-username=<clientId> \\
#     --docker-password=<clientSecret> -n ${NS}
apiVersion: v1
kind: Secret
metadata:
  name: acr-secret
  namespace: ${NS}
type: kubernetes.io/dockerconfigjson
data: {}
`);

for (const { app, port, envVar, replicas = 1 } of APPS) {
  const n = replicas;
  write(`10-${app}.yaml`, `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${app}
  namespace: ${NS}
  labels:
    app: ${app}
spec:
  replicas: ${n}
  selector:
    matchLabels:
      app: ${app}
  template:
    metadata:
      labels:
        app: ${app}
    spec:
      imagePullSecrets:
        - name: acr-secret
      containers:
        - name: ${app}
          image: ${image(app)}
          imagePullPolicy: IfNotPresent
          envFrom:
            - configMapRef:
                name: nova-store-config
            - secretRef:
                name: nova-store-secrets
          env:
            - name: ${envVar}
              value: "${port}"
          ports:
            - name: http
              containerPort: ${port}
          livenessProbe:
            tcpSocket:
              port: ${port}
            initialDelaySeconds: 20
            periodSeconds: 20
          readinessProbe:
            tcpSocket:
              port: ${port}
            initialDelaySeconds: 10
            periodSeconds: 10
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 384Mi
---
apiVersion: v1
kind: Service
metadata:
  name: ${app}
  namespace: ${NS}
spec:
  selector:
    app: ${app}
  ports:
    - port: ${port}
      targetPort: ${port}
`);
}

// ---------------- client ----------------
write('30-client.yaml', `apiVersion: apps/v1
kind: Deployment
metadata:
  name: client
  namespace: ${NS}
  labels:
    app: client
spec:
  replicas: 2
  selector:
    matchLabels:
      app: client
  template:
    metadata:
      labels:
        app: client
    spec:
      imagePullSecrets:
        - name: acr-secret
      containers:
        - name: client
          image: ${image('client')}
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 5173
          livenessProbe:
            tcpSocket:
              port: 5173
            initialDelaySeconds: 20
            periodSeconds: 20
          readinessProbe:
            tcpSocket:
              port: 5173
            initialDelaySeconds: 10
            periodSeconds: 10
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 250m
              memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: client
  namespace: ${NS}
spec:
  selector:
    app: client
  ports:
    - port: 5173
      targetPort: 5173
`);

// ---------------- ingress ----------------
write('40-ingress.yaml', `# NGINX ingress for outside access.
# Prereq: ingress-nginx controller installed (e.g. az aks ingress or helm).
# Set host to your domain, or use '<EXTERNAL-IP>.nip.io' for a quick public URL.
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nova-store
  namespace: ${NS}
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  rules:
    - host: nova-store.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: client
                port:
                  number: 5173
  # Choose one: cert-manager for TLS (recommended) — create Issuer/ClusterIssuer:
  # tls:
  #   - hosts:
  #       - nova-store.example.com
  #     secretName: nova-store-tls
`);

// ---------------- README ----------------
write('README.md', `# Nova Store — Kubernetes deployment (AKS)

Manifests are generated by \`node infrastructure/scripts/generate-k8s.mjs [acrName] [imageTag]\`.
Images: \`${registry}/nova/*:${imageTag}\`.

## Prereqs
- AKS cluster + \`az aks get-credentials\`
- Images for all 13 apps pushed to ACR (see \`.github/workflows/docker-image.yml\`)
- Azure Database for MySQL reachable from the cluster (same config as local \`.env\`)

## Deploy
\`\`\`bash
kubectl apply -f k8s/00-namespace.yaml

# 1. ACR pull credentials (needs one-time per namespace):
kubectl create secret docker-registry acr-secret \\
  --docker-server=${registry} --docker-username=<clientId> \\
  --docker-password=<clientSecret> -n ${NS}

# 2. Config + secrets (edit CHANGE_ME_* values and DB_HOST first)
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secret.yaml

# 3. Backends + client
kubectl apply -f k8s/10-api-gateway.yaml -f k8s/10-auth-service.yaml
kubectl apply -f k8s/10-user-service.yaml
kubectl apply -f k8s/10-product-service.yaml
kubectl apply -f k8s/10-inventory-service.yaml
kubectl apply -f k8s/10-cart-service.yaml
kubectl apply -f k8s/10-order-service.yaml
kubectl apply -f k8s/10-payment-service.yaml
kubectl apply -f k8s/10-shipping-service.yaml
kubectl apply -f k8s/10-review-service.yaml
kubectl apply -f k8s/10-search-service.yaml
kubectl apply -f k8s/10-notification-service.yaml
kubectl apply -f k8s/30-client.yaml

kubectl rollout status deploy -n ${NS} --timeout=5m
\`\`\`

## Ingress (outside access)
Ensure the NGINX ingress controller is installed:
\`\`\`bash
# Option A — AKS ingress add-on:
az aks ingress enable --resource-group <rg> --name <cluster> --app-addon ingress-appgw
# Option B — Helm (nginx):
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace \\
  --set controller.service.type=LoadBalancer
\`\`\`

Get the public IP:
\`\`\`bash
kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
\`\`\`

Then either:
- set the Ingress \`host\` to that IP with \`.nip.io\` (e.g. \`20.204.55.77.nip.io\`), or
- point your DNS A-record at the IP and use your domain.

Apply the ingress and check:
\`\`\`bash
kubectl apply -f k8s/40-ingress.yaml
curl -k https://<your-host>/api/products   # health check through the gateway
\`\`\`

### TLS (recommended)
Install cert-manager, create a ClusterIssuer for Let's Encrypt, uncomment the
\`tls\` block in \`40-ingress.yaml\` (secretName \`nova-store-tls\`), and add
annotations:
\`\`\`yaml
cert-manager.io/cluster-issuer: letsencrypt-prod
nginx.ingress.kubernetes.io/ssl-redirect: "true"
\`\`\`

## Notes
- Database runs on Azure MySQL (not in-cluster) — set \`DB_SSL=true\` (already in configmap).
- \`imagePullPolicy: IfNotPresent\` — new deployments won't pick up \`:latest\` changes;
  tag images explicitly (e.g. git SHA) or set \`Never\`/\`Always\` per need.
- Scale stateless services: \`kubectl scale deploy/product-service -n ${NS} --replicas=3\`.
`);

console.log(`Generated ${fs.readdirSync(outDir).filter((f) => f !== 'README.md').length + 1} files in k8s/`);