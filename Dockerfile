# ==============================================================================
# Motzklist Admin Panel - Multi-Stage Dockerfile
# ==============================================================================
# This Dockerfile supports both DEVELOPMENT and PRODUCTION builds.
#
# USAGE:
#   Development (with hot reload):
#     docker build --target development -t motzklist-admin:dev .
#     docker run -p 3000:3000 -v $(pwd)/src:/app/src motzklist-admin:dev
#
#   Production:
#     docker build --target production -t motzklist-admin:prod .
#     docker run -p 3000:3000 motzklist-admin:prod
#
#   Or use docker-compose (recommended):
#     docker-compose up --build
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base - Common setup for all stages
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base

# Install libc6-compat for Alpine compatibility with some npm packages
RUN apk add --no-cache libc6-compat

WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 2: Dependencies - Install node_modules (cached layer)
# ------------------------------------------------------------------------------
FROM base AS deps

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
# Using --frozen-lockfile equivalent ensures reproducible builds
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 3: Development - Hot reload enabled
# ------------------------------------------------------------------------------
FROM base AS development

WORKDIR /app

# Copy node_modules from deps stage (leverages Docker cache)
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Set development environment
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Start Next.js in development mode with hot reload
CMD ["npm", "run", "dev"]

# ------------------------------------------------------------------------------
# Stage 4: Builder - Build the production application
# ------------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

# Copy node_modules and source files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production environment for build optimization
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time environment variables
ARG API_URL
ARG NEXT_PUBLIC_API_URL
# Mocks are OFF by default; pass --build-arg NEXT_PUBLIC_USE_MOCKS=true to opt in.
ARG NEXT_PUBLIC_USE_MOCKS=false
ARG SESSION_SECRET
# Authentication provider (build-time; NEXT_PUBLIC_* is inlined into the bundle).
# 'api' = username/password (default), 'google'/'microsoft' = third-party OAuth.
# See src/services/auth/. The redirect uses GOOGLE_CLIENT_ID (admin server env)
# and the backend's GOOGLE_CLIENT_SECRET, both supplied at runtime.
ARG NEXT_PUBLIC_AUTH_PROVIDER=api

ENV API_URL=$API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_USE_MOCKS=$NEXT_PUBLIC_USE_MOCKS
ENV SESSION_SECRET=$SESSION_SECRET
ENV NEXT_PUBLIC_AUTH_PROVIDER=$NEXT_PUBLIC_AUTH_PROVIDER

# Build the Next.js application
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 5: Production - Minimal runtime image
# ------------------------------------------------------------------------------
FROM base AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

EXPOSE 3001

# Start the production server
CMD ["node", "server.js"]
