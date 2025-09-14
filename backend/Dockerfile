# Build stage
FROM node:16.14-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Configure npm for better reliability
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set network-timeout 300000 && \
    npm config set registry https://registry.npmjs.org/

# Install dependencies with multiple attempts using legacy-peer-deps
RUN for i in $(seq 1 5); do \
      echo "Attempt $i to install dependencies..." && \
      npm install --omit=dev --legacy-peer-deps && exit 0 || \
      echo "Attempt $i failed, waiting before retry..." && \
      sleep 5; \
    done && \
    echo "All attempts failed" && \
    exit 1

# Copy source code
COPY . .

# Production stage
FROM node:16.14-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs uploads logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]