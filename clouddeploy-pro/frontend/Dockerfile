# Frontend Dockerfile - Multi-stage build with optimized layer caching

# Stage 1: Builder - Install and build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first (leverages caching if package.json hasn't changed)
COPY package*.json ./

# Install dependencies with fallback (use npm install if no lock file)
# This layer is cached if package files don't change
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code (this layer changes frequently)
COPY . .

# Build the application
RUN npm run build

# Stage 2: Runtime - Final image
FROM nginx:alpine

# Set metadata for security scanning and documentation
LABEL maintainer="CloudDeploy Pro" \
      description="CloudDeploy Pro Frontend - React Dashboard"

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder (efficient - only final build output)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing and security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user context (nginx already runs as non-root by default)
RUN addgroup -g 101 -S nginx 2>/dev/null || true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q -O- http://localhost/health || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]