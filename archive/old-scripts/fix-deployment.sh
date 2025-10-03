#!/bin/bash

set -e

echo "=== TRADEAI Deployment Fix ==="
echo "This script will fix the current deployment issues"
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

log "Starting deployment fix..."

# Stop any existing containers
log "Stopping existing containers..."
cd /opt/tradeai 2>/dev/null || {
    error "TRADEAI directory not found. Running full deployment first..."
    curl -fsSL https://raw.githubusercontent.com/Reshigan/TRADEAI/main/deploy-aws-fixed.sh | bash
    exit 0
}

# Stop containers if they exist
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true

# Clean up any orphaned containers
docker container prune -f 2>/dev/null || true

# Pull latest changes
log "Pulling latest code..."
git pull origin main || {
    warn "Git pull failed, continuing with existing code"
}

# Ensure correct permissions
log "Setting correct permissions..."
chown -R root:root /opt/tradeai
chmod +x /opt/tradeai/*.sh 2>/dev/null || true

# Check environment file
if [ ! -f /opt/tradeai/.env ]; then
    log "Creating environment file..."
    cp .env.production .env
    
    # Set production values
    sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
    sed -i 's/DOMAIN=localhost/DOMAIN=tradeai.gonxt.tech/' .env
    sed -i 's/ENABLE_SSL=false/ENABLE_SSL=true/' .env
    sed -i 's/SSL_EMAIL=.*/SSL_EMAIL=reshigan@gonxt.tech/' .env
    sed -i 's/SEED_DATA=false/SEED_DATA=true/' .env
fi

# Build and start services
log "Building and starting services..."

# Detect architecture
ARCH=$(uname -m)
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    COMPOSE_FILE="docker-compose-arm64.yml"
    log "Detected ARM64 architecture, using $COMPOSE_FILE"
else
    COMPOSE_FILE="docker-compose.yml"
    log "Detected AMD64 architecture, using $COMPOSE_FILE"
fi

# Start services
log "Starting Docker services..."
docker-compose -f $COMPOSE_FILE up -d --build

# Wait for services to start
log "Waiting for services to initialize..."
sleep 30

# Check service health
log "Checking service health..."
for i in {1..12}; do
    if docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        log "Services are starting up... (attempt $i/12)"
        break
    fi
    if [ $i -eq 12 ]; then
        error "Services failed to start properly"
        docker-compose -f $COMPOSE_FILE logs
        exit 1
    fi
    sleep 10
done

# Verify nginx configuration
log "Verifying nginx configuration..."
if [ -f /etc/nginx/sites-available/tradeai ]; then
    nginx -t || {
        error "Nginx configuration test failed"
        exit 1
    }
    systemctl reload nginx
else
    warn "Nginx site configuration not found, using container nginx"
fi

# Test the deployment
log "Testing deployment..."
sleep 10

# Check if the API is responding
API_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://tradeai.gonxt.tech/api/v1/health 2>/dev/null || echo "000")
if [ "$API_STATUS" = "200" ]; then
    log "API is responding correctly"
else
    warn "API not responding (status: $API_STATUS), checking container logs..."
    docker-compose -f $COMPOSE_FILE logs backend
fi

# Check if frontend is serving
FRONTEND_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://tradeai.gonxt.tech 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    # Check if it's the actual React app or just the placeholder
    CONTENT=$(curl -k -s https://tradeai.gonxt.tech 2>/dev/null)
    if echo "$CONTENT" | grep -q "System Initializing"; then
        warn "Still serving placeholder page, checking frontend container..."
        docker-compose -f $COMPOSE_FILE logs frontend
        
        # Try to restart frontend container
        log "Restarting frontend container..."
        docker-compose -f $COMPOSE_FILE restart frontend
        sleep 15
    else
        log "Frontend is serving correctly"
    fi
else
    warn "Frontend not responding (status: $FRONTEND_STATUS)"
fi

# Show final status
log "Deployment fix complete!"
echo
echo "=== Service Status ==="
docker-compose -f $COMPOSE_FILE ps

echo
echo "=== Access URLs ==="
echo "Main Application: https://tradeai.gonxt.tech"
echo "API Health: https://tradeai.gonxt.tech/api/v1/health"
echo "API Status: https://tradeai.gonxt.tech/api/v1/status"

echo
echo "=== Test Credentials ==="
echo "Email: test@tradeai.com"
echo "Password: testuser"

echo
log "If issues persist, run: /opt/tradeai/diagnose-deployment.sh"