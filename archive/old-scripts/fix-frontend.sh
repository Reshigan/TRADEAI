#!/bin/bash

set -e

echo "=== TRADEAI Frontend Fix ==="
echo "Rebuilding and fixing the React frontend"
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

log "Starting frontend fix..."

# Go to the TRADEAI directory
cd /opt/tradeai || {
    error "TRADEAI directory not found at /opt/tradeai"
    exit 1
}

# Detect architecture and use appropriate compose file
ARCH=$(uname -m)
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    COMPOSE_FILE="docker-compose-arm64.yml"
    log "Using ARM64 compose file: $COMPOSE_FILE"
else
    COMPOSE_FILE="docker-compose.yml"
    log "Using AMD64 compose file: $COMPOSE_FILE"
fi

# Stop only the frontend container
log "Stopping frontend container..."
docker-compose -f $COMPOSE_FILE stop frontend || true

# Remove the frontend container and image to force rebuild
log "Removing frontend container and image..."
docker-compose -f $COMPOSE_FILE rm -f frontend || true
docker rmi tradeai-frontend 2>/dev/null || true

# Check the frontend Dockerfile
log "Checking frontend Dockerfile..."
if [ -f frontend/Dockerfile ]; then
    echo "Frontend Dockerfile exists"
else
    error "Frontend Dockerfile not found!"
    exit 1
fi

# Check if frontend source files exist
log "Checking frontend source files..."
if [ -d frontend/src ]; then
    echo "Frontend source directory exists"
    ls -la frontend/src/ | head -10
else
    error "Frontend source directory not found!"
    exit 1
fi

# Check package.json
if [ -f frontend/package.json ]; then
    echo "Frontend package.json exists"
    grep -E "(name|version|scripts)" frontend/package.json | head -5
else
    error "Frontend package.json not found!"
    exit 1
fi

# Build only the frontend service with no cache
log "Building frontend container (no cache)..."
docker-compose -f $COMPOSE_FILE build --no-cache frontend

# Start the frontend container
log "Starting frontend container..."
docker-compose -f $COMPOSE_FILE up -d frontend

# Wait for frontend to start
log "Waiting for frontend to initialize..."
sleep 30

# Check frontend container logs
log "Checking frontend container logs..."
docker-compose -f $COMPOSE_FILE logs --tail 20 frontend

# Test frontend directly
log "Testing frontend container directly..."
FRONTEND_STATUS=$(docker exec trade-ai-frontend curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null || echo "000")
echo "Frontend container internal status: $FRONTEND_STATUS"

# Test frontend via host port
FRONTEND_HOST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
echo "Frontend host port status: $FRONTEND_HOST_STATUS"

# Get a sample of what's being served
log "Sample of frontend content:"
curl -s http://localhost:3000 2>/dev/null | head -20 || echo "Could not fetch content"

# Check nginx configuration inside frontend container
log "Checking nginx config inside frontend container..."
docker exec trade-ai-frontend cat /etc/nginx/conf.d/default.conf 2>/dev/null || echo "Could not read nginx config"

# Check if React build files exist
log "Checking React build files in container..."
docker exec trade-ai-frontend ls -la /usr/share/nginx/html/ 2>/dev/null || echo "Could not list build files"

# Restart nginx proxy to ensure routing
log "Restarting nginx proxy..."
docker-compose -f $COMPOSE_FILE restart nginx

# Final test
log "Final test of the application..."
sleep 10

# Test the main site
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://tradeai.gonxt.tech 2>/dev/null || echo "000")
echo "Main site status: $MAIN_STATUS"

if [ "$MAIN_STATUS" = "200" ]; then
    # Check if it's still the placeholder
    CONTENT=$(curl -s http://tradeai.gonxt.tech 2>/dev/null | head -5)
    if echo "$CONTENT" | grep -q "System Ready"; then
        warn "Still serving placeholder content"
        echo "Content preview:"
        echo "$CONTENT"
    else
        log "Frontend appears to be serving React app!"
    fi
else
    warn "Main site not responding properly"
fi

# Show container status
echo
echo "=== Container Status ==="
docker-compose -f $COMPOSE_FILE ps

echo
echo "=== Frontend Container Details ==="
docker inspect trade-ai-frontend --format='{{.State.Status}}: {{.State.Health.Status}}' 2>/dev/null || echo "Could not get container details"

log "Frontend fix complete!"
echo
echo "If the issue persists, the React app may not be building correctly."
echo "Check the frontend build process with:"
echo "docker-compose -f $COMPOSE_FILE logs frontend"