#!/bin/bash

set -e

echo "=== Force React Build Fix ==="
echo "This will force a proper React build instead of the fallback"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
   exit 1
fi

log "Starting React build fix..."

# Go to the TRADEAI directory
cd /opt/tradeai || {
    error "TRADEAI directory not found at /opt/tradeai"
    exit 1
}

# Create a new Dockerfile that forces React build to succeed
log "Creating fixed Dockerfile..."
cat > frontend/Dockerfile.fixed << 'EOF'
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Configure npm for better reliability
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set registry https://registry.npmjs.org/

# Clear npm cache
RUN npm cache clean --force

# Install dependencies with multiple attempts
RUN for i in $(seq 1 3); do \
      echo "Attempt $i to install dependencies..." && \
      npm install --legacy-peer-deps --force && break || \
      (echo "Attempt $i failed, cleaning and retrying..." && \
       rm -rf node_modules package-lock.json && \
       sleep 5); \
    done

# Copy source code
COPY . .

# Set build environment variables
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS="--max-old-space-size=6144"
ENV REACT_APP_API_URL="/api/v1"
ENV REACT_APP_SOCKET_URL=""
ENV REACT_APP_AI_API_URL="/ai"
ENV REACT_APP_MONITORING_URL="/monitoring"

# Create health.json in public directory
RUN echo '{"status":"UP","service":"tradeai-frontend"}' > public/health.json

# Force React build (no fallback)
RUN echo "Starting React build..." && \
    npm run build:react && \
    echo "React build completed successfully!" && \
    ls -la build/ && \
    test -f build/index.html && \
    test -d build/static && \
    echo "Build verification passed!"

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Verify the build was copied correctly
RUN ls -la /usr/share/nginx/html/ && \
    test -f /usr/share/nginx/html/index.html && \
    test -d /usr/share/nginx/html/static && \
    echo "Production build verification passed!"

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health.json || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

# Stop the frontend container
log "Stopping frontend container..."
docker-compose stop frontend || true

# Remove the frontend container and image
log "Removing frontend container and image..."
docker-compose rm -f frontend || true
docker rmi tradeai-frontend 2>/dev/null || true

# Build with the fixed Dockerfile
log "Building frontend with fixed Dockerfile..."
docker build -f frontend/Dockerfile.fixed -t tradeai-frontend frontend/

# Start the frontend container
log "Starting frontend container..."
docker-compose up -d frontend

# Wait for container to start
log "Waiting for frontend to start..."
sleep 20

# Check the build
log "Verifying the React build..."
docker exec trade-ai-frontend ls -la /usr/share/nginx/html/
echo
docker exec trade-ai-frontend ls -la /usr/share/nginx/html/static/
echo

# Check if we have actual React files
JS_FILES=$(docker exec trade-ai-frontend find /usr/share/nginx/html/static -name "*.js" | wc -l)
CSS_FILES=$(docker exec trade-ai-frontend find /usr/share/nginx/html/static -name "*.css" | wc -l)

log "Found $JS_FILES JavaScript files and $CSS_FILES CSS files"

if [ "$JS_FILES" -gt 0 ] && [ "$CSS_FILES" -gt 0 ]; then
    log "✅ React build files found!"
else
    warn "⚠️  React build files missing, checking index.html content..."
fi

# Check the actual content being served
log "Checking index.html content..."
CONTENT=$(docker exec trade-ai-frontend head -5 /usr/share/nginx/html/index.html)
if echo "$CONTENT" | grep -q "System Initializing"; then
    error "❌ Still serving fallback content!"
    echo "Content preview:"
    echo "$CONTENT"
else
    log "✅ Serving proper React app!"
fi

# Test the application
log "Testing the application..."
sleep 5

# Test direct frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
log "Frontend direct test: $FRONTEND_STATUS"

# Test main site
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://tradeai.gonxt.tech 2>/dev/null || echo "000")
log "Main site test: $MAIN_STATUS"

# Show container status
echo
echo "=== Container Status ==="
docker-compose ps

log "React build fix complete!"
echo
echo "If the React app is now working, you should see:"
echo "- JavaScript and CSS files in the static directory"
echo "- Proper React HTML instead of the placeholder"
echo "- The application loading at http://tradeai.gonxt.tech"
EOF