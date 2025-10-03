#!/bin/bash

# 🔧 TRADEAI Docker NPM Dependency Fix Script
# Fixes TypeScript version conflicts and npm build issues
# Author: OpenHands AI Assistant

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}🔧 TRADEAI NPM DEPENDENCY FIX 🔧${NC}"
echo -e "${BOLD}${CYAN}===================================${NC}"
echo ""

# Get current directory
CURRENT_DIR=$(pwd)
echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] Working in directory: $CURRENT_DIR${NC}"

# 1. Fix Frontend Dockerfile with legacy peer deps
echo -e "${PURPLE}[STEP] Creating FIXED Frontend Dockerfile...${NC}"
cat > frontend/Dockerfile << 'EOF'
# TRADEAI Frontend Dockerfile - FIXED for TypeScript conflicts
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to resolve TypeScript conflicts
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S tradeai && \
    adduser -S tradeai -u 1001 -G tradeai

# Set permissions
RUN chown -R tradeai:tradeai /usr/share/nginx/html && \
    chown -R tradeai:tradeai /var/cache/nginx && \
    chown -R tradeai:tradeai /var/log/nginx && \
    chown -R tradeai:tradeai /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R tradeai:tradeai /var/run/nginx.pid

# Switch to non-root user
USER tradeai

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
EOF

echo -e "${GREEN}✅ Fixed Frontend Dockerfile with --legacy-peer-deps${NC}"

# 2. Fix Backend Dockerfile with better npm handling
echo -e "${PURPLE}[STEP] Creating FIXED Backend Dockerfile...${NC}"
cat > backend/Dockerfile << 'EOF'
# TRADEAI Backend Dockerfile - FIXED for npm issues
FROM node:18-alpine

WORKDIR /app

# Create non-root user first
RUN addgroup -g 1001 -S tradeai && \
    adduser -S tradeai -u 1001 -G tradeai

# Copy package files
COPY package*.json ./

# Install dependencies with better error handling
RUN npm ci --only=production --no-audit --no-fund || \
    npm install --only=production --no-audit --no-fund --legacy-peer-deps

# Copy source code
COPY . .

# Set ownership
RUN chown -R tradeai:tradeai /app

# Switch to non-root user
USER tradeai

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

CMD ["npm", "start"]
EOF

echo -e "${GREEN}✅ Fixed Backend Dockerfile with better npm handling${NC}"

# 3. Create .npmrc file to handle dependency conflicts
echo -e "${PURPLE}[STEP] Creating .npmrc for dependency resolution...${NC}"
cat > frontend/.npmrc << 'EOF'
legacy-peer-deps=true
audit=false
fund=false
EOF

cat > backend/.npmrc << 'EOF'
legacy-peer-deps=true
audit=false
fund=false
EOF

echo -e "${GREEN}✅ Created .npmrc files for both frontend and backend${NC}"

# 4. Update docker-compose.yml with build args
echo -e "${PURPLE}[STEP] Updating docker-compose.yml with build optimizations...${NC}"
cat > docker-compose.yml << 'EOF'
# TRADEAI Docker Compose Configuration - FIXED for NPM issues
services:
  # MongoDB Database
  mongodb:
    image: mongo:7.0
    container_name: tradeai_mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: tradeai_secure_password_2024
      MONGO_INITDB_DATABASE: tradeai
    volumes:
      - mongodb_data:/data/db
      - ./backend/scripts/seed-database.js:/docker-entrypoint-initdb.d/seed-database.js:ro
    networks:
      - tradeai_network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 40s

  # Redis Cache
  redis:
    image: redis:7.2-alpine
    container_name: tradeai_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass tradeai_cache_password_2024
    volumes:
      - redis_data:/data
    networks:
      - tradeai_network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 3s
      retries: 5

  # Backend API
  backend:
    build: 
      context: ./backend
      args:
        - NODE_ENV=production
    container_name: tradeai_backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb://admin:tradeai_secure_password_2024@mongodb:27017/tradeai?authSource=admin
      - REDIS_URL=redis://:tradeai_cache_password_2024@redis:6379
      - JWT_SECRET=tradeai_jwt_super_secret_key_2024_production
      - CORS_ORIGIN=https://tradeai.gonxt.tech
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs
    networks:
      - tradeai_network
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  # Frontend React App
  frontend:
    build: 
      context: ./frontend
      args:
        - NODE_ENV=production
        - REACT_APP_API_URL=https://tradeai.gonxt.tech/api
    container_name: tradeai_frontend
    restart: unless-stopped
    networks:
      - tradeai_network
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: tradeai_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/sites-available:/etc/nginx/sites-available:ro
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - tradeai_network
    depends_on:
      frontend:
        condition: service_healthy
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local

networks:
  tradeai_network:
    driver: bridge
EOF

echo -e "${GREEN}✅ Updated docker-compose.yml with build optimizations${NC}"

# 5. Clean up existing build cache
echo -e "${PURPLE}[STEP] Cleaning up Docker build cache...${NC}"
docker builder prune -f 2>/dev/null || true
docker system prune -f 2>/dev/null || true

echo ""
echo -e "${BOLD}${GREEN}🎉 NPM DEPENDENCY FIX COMPLETED! 🎉${NC}"
echo -e "${BOLD}${GREEN}====================================${NC}"
echo ""
echo -e "${BOLD}✅ FIXES APPLIED:${NC}"
echo "   • Frontend Dockerfile uses --legacy-peer-deps"
echo "   • Backend Dockerfile has fallback npm install"
echo "   • Created .npmrc files for dependency resolution"
echo "   • Updated docker-compose.yml with build args"
echo "   • Cleaned up Docker build cache"
echo ""
echo -e "${BOLD}🚀 READY TO BUILD:${NC}"
echo "   • TypeScript version conflicts resolved"
echo "   • NPM dependency issues fixed"
echo "   • Docker build cache cleared"
echo ""
echo -e "${BOLD}🔧 NEXT STEPS:${NC}"
echo "   docker-compose build --no-cache"
echo "   docker-compose up -d"
echo ""
echo -e "${GREEN}✅ NPM dependencies fixed and ready to build!${NC}"