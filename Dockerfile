# Bond It Pre-Coating Inspection — Dokploy-ready image.
# Multi-stage: build the static export with Node, serve it with nginx.
# Dokploy auto-detects this Dockerfile; set the app's port to 80 in the UI.

# ---- Build stage -----------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies against the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

# Build the static site → /app/out
COPY . .
RUN npm run build

# ---- Runtime stage ---------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Routing + caching for the trailing-slash static export.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Ship only the exported static files.
COPY --from=build /app/out /usr/share/nginx/html

EXPOSE 80

# Basic container healthcheck for Dokploy/Traefik.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
