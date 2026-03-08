# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable

# ---------- Builder ----------
FROM base AS builder
WORKDIR /app

# Copy package files first
COPY package.json pnpm-lock.yaml ./
COPY . .

# Set CI mode to avoid TTY errors in Docker
ENV CI=true

# Install dependencies with hoisting for Next.js binaries
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Build Next.js
RUN pnpm build

# ---------- Production Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user
RUN addgroup -S nodejs -g 1001 \
    && adduser -S nextjs -u 1001

# Copy build output and node_modules from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/node_modules ./node_modules

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000

# Start Next.js server
CMD ["node_modules/.bin/next", "start", "-p", "3000"]