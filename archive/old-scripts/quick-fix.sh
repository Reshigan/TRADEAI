#!/bin/bash

set -e

echo "=== TRADEAI Quick Fix ==="
echo "Fixing the deployment without SSL complications"
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

log "Starting quick fix..."

# Go to the TRADEAI directory
cd /opt/tradeai || {
    error "TRADEAI directory not found at /opt/tradeai"
    exit 1
}

# Stop the old VantaX service that's interfering
log "Stopping interfering services..."
systemctl stop vantax-demo.service 2>/dev/null || true
systemctl disable vantax-demo.service 2>/dev/null || true

# Stop existing containers
log "Stopping existing containers..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true

# Clean up containers and images
log "Cleaning up Docker resources..."
docker container prune -f 2>/dev/null || true
docker image prune -f 2>/dev/null || true

# Fix permissions
log "Fixing permissions..."
chown -R root:root /opt/tradeai
chmod +x /opt/tradeai/*.sh 2>/dev/null || true

# Create a simple environment file
log "Creating environment file..."
cat > .env << 'EOF'
# TRADEAI Production Environment
NODE_ENV=production
DOMAIN=tradeai.gonxt.tech
SERVER_IP=13.247.139.75

# Database Configuration
MONGO_USERNAME=admin
MONGO_PASSWORD=tradeai_secure_2024
MONGO_DATABASE=tradeai
MONGODB_URI=mongodb://admin:tradeai_secure_2024@mongodb:27017/tradeai?authSource=admin

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=tradeai_jwt_secret_key_2024_production
JWT_REFRESH_SECRET=tradeai_refresh_secret_key_2024_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
PORT=5000
BACKEND_PORT=5000
AI_SERVICES_PORT=8000
MONITORING_PORT=8080
FRONTEND_PORT=80

# CORS Configuration
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info

# React App Configuration
REACT_APP_API_URL=/api/v1
REACT_APP_SOCKET_URL=
REACT_APP_AI_API_URL=/ai
REACT_APP_MONITORING_URL=/monitoring

# Build Configuration
CACHEBUST=1757838267

# SSL Configuration (disabled for now)
ENABLE_SSL=false
SSL_EMAIL=reshigan@gonxt.tech

# Database Seeding
SEED_DATA=true
EOF

# Use the simple nginx configuration without SSL
log "Setting up nginx configuration..."
cp nginx-simple.conf nginx.conf

# Detect architecture and use appropriate compose file
ARCH=$(uname -m)
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    COMPOSE_FILE="docker-compose-arm64.yml"
    log "Detected ARM64 architecture, using $COMPOSE_FILE"
else
    COMPOSE_FILE="docker-compose.yml"
    log "Detected AMD64 architecture, using $COMPOSE_FILE"
fi

# Build and start services
log "Building and starting services..."
docker-compose -f $COMPOSE_FILE up -d --build --force-recreate

# Wait for services to start
log "Waiting for services to initialize..."
sleep 45

# Check service health
log "Checking service health..."
for i in {1..24}; do
    CONTAINERS_UP=$(docker-compose -f $COMPOSE_FILE ps | grep -c "Up" || echo "0")
    if [ "$CONTAINERS_UP" -ge 5 ]; then
        log "Services are running (attempt $i/24)"
        break
    fi
    if [ $i -eq 24 ]; then
        warn "Some services may not be fully healthy yet"
        docker-compose -f $COMPOSE_FILE ps
    fi
    sleep 5
done

# Test the deployment
log "Testing deployment..."
sleep 10

# Check if the API is responding
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/v1/health 2>/dev/null || echo "000")
if [ "$API_STATUS" = "200" ]; then
    log "API is responding correctly"
else
    warn "API not responding (status: $API_STATUS)"
fi

# Check if frontend is serving
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    log "Frontend is responding"
else
    warn "Frontend not responding (status: $FRONTEND_STATUS)"
fi

# Show final status
log "Quick fix complete!"
echo
echo "=== Service Status ==="
docker-compose -f $COMPOSE_FILE ps

echo
echo "=== Access URLs ==="
echo "Main Application: http://tradeai.gonxt.tech"
echo "API Health: http://tradeai.gonxt.tech/api/v1/health"
echo "Direct Frontend: http://tradeai.gonxt.tech:3000"
echo "Direct API: http://tradeai.gonxt.tech:5001/api/v1/health"

echo
echo "=== Test Credentials ==="
echo "Email: test@tradeai.com"
echo "Password: testuser"

echo
log "If issues persist, check logs with: docker-compose -f $COMPOSE_FILE logs [service_name]"