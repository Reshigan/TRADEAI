#!/bin/bash

set -e

echo "=== Fix Icon Import Issue ==="
echo "Fixing the Integration icon import that's causing React build to fail"
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

log "Starting icon import fix..."

# Go to the TRADEAI directory
cd /opt/tradeai || {
    error "TRADEAI directory not found at /opt/tradeai"
    exit 1
}

# Fix the icon import in SettingsPage.js
log "Fixing Integration icon import..."

# Replace Integration with a valid icon (Settings or Hub)
sed -i 's/Integration as IntegrationIcon/Hub as IntegrationIcon/g' frontend/src/components/settings/SettingsPage.js

# Verify the fix
log "Verifying the fix..."
if grep -q "Hub as IntegrationIcon" frontend/src/components/settings/SettingsPage.js; then
    log "✅ Icon import fixed successfully!"
else
    error "❌ Failed to fix icon import"
    exit 1
fi

# Show the fixed line
log "Fixed import line:"
grep -n "Hub as IntegrationIcon" frontend/src/components/settings/SettingsPage.js

# Now rebuild the frontend
log "Rebuilding frontend with fixed icon..."

# Stop the frontend container
docker-compose stop frontend || true

# Remove the frontend container and image
docker-compose rm -f frontend || true
docker rmi tradeai-frontend 2>/dev/null || true

# Build with the original Dockerfile (now that the import is fixed)
log "Building frontend with fixed import..."
docker-compose build --no-cache frontend

# Start the frontend container
log "Starting frontend container..."
docker-compose up -d frontend

# Wait for container to start
log "Waiting for frontend to start..."
sleep 30

# Check the build
log "Verifying the React build..."
docker exec trade-ai-frontend ls -la /usr/share/nginx/html/static/

# Check if we have actual React files
JS_FILES=$(docker exec trade-ai-frontend find /usr/share/nginx/html/static -name "*.js" | wc -l)
CSS_FILES=$(docker exec trade-ai-frontend find /usr/share/nginx/html/static -name "*.css" | wc -l)

log "Found $JS_FILES JavaScript files and $CSS_FILES CSS files"

if [ "$JS_FILES" -gt 0 ] && [ "$CSS_FILES" -gt 0 ]; then
    log "✅ React build files found!"
    
    # Check the actual content being served
    CONTENT=$(docker exec trade-ai-frontend head -10 /usr/share/nginx/html/index.html)
    if echo "$CONTENT" | grep -q "System Initializing"; then
        warn "⚠️  Still serving fallback content - React build may have other issues"
    else
        log "✅ Serving proper React app!"
    fi
else
    warn "⚠️  React build files missing - there may be other build issues"
fi

# Test the application
log "Testing the application..."
sleep 10

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

log "Icon import fix complete!"
echo
echo "The Integration icon has been replaced with Hub icon."
echo "If there are other build errors, they will be shown in the container logs:"
echo "docker-compose logs frontend"