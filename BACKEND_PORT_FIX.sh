#!/bin/bash

# 🔧 TRADEAI Backend Port Configuration Fix
# Fixes port configuration mismatch between deployment script and backend config

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
BACKEND_PORT=3001
APP_DIR="/var/www/tradeai"

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

step() {
    echo -e "${PURPLE}[STEP] $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root (use sudo)"
    exit 1
fi

log "🔧 Starting TRADEAI Backend Port Configuration Fix"

# Check current backend configuration
step "Checking Current Backend Configuration"
cd "$APP_DIR/backend"

if [ -f "src/config/index.js" ]; then
    log "✅ Backend config found"
    echo -e "${BLUE}Current port configuration:${NC}"
    grep -n "port:" src/config/index.js || true
else
    error "❌ Backend config not found"
    exit 1
fi

# Check what ports are currently in use
step "Checking Current Port Usage"
echo -e "${BLUE}Ports currently in use by node processes:${NC}"
netstat -tlnp | grep node || warning "No node processes found listening"

# Stop existing backend processes
step "Stopping Existing Backend Processes"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Kill any processes on both ports
step "Clearing Ports"
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

# Create environment file to ensure correct port
step "Creating Environment Configuration"
cat > .env << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=$BACKEND_PORT

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/tradeai
USE_MOCK_DB=true

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Logging
LOG_LEVEL=info
EOF

log "✅ Environment file created with PORT=$BACKEND_PORT"

# Create updated PM2 ecosystem configuration
step "Creating Updated PM2 Configuration"
cat > ecosystem.backend.js << EOF
module.exports = {
  apps: [{
    name: 'tradeai-backend',
    script: 'src/server.js',
    cwd: '$APP_DIR/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: $BACKEND_PORT,
      HOST: '0.0.0.0',
      MONGODB_URI: 'mongodb://localhost:27017/tradeai',
      USE_MOCK_DB: 'true'
    },
    error_file: '/var/log/pm2/tradeai-backend-error.log',
    out_file: '/var/log/pm2/tradeai-backend-out.log',
    log_file: '/var/log/pm2/tradeai-backend.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Ensure log directory exists
mkdir -p /var/log/pm2
chown -R www-data:www-data /var/log/pm2

# Set proper permissions
chown -R www-data:www-data "$APP_DIR"

# Start backend service
step "Starting Backend Service with Correct Port"
pm2 start ecosystem.backend.js

# Wait for service to start
sleep 8

# Check PM2 status
step "Checking PM2 Status"
pm2 status

# Check if service is running on correct port
step "Verifying Port Configuration"
sleep 3

if netstat -tlnp | grep ":$BACKEND_PORT "; then
    log "✅ Backend is listening on port $BACKEND_PORT"
    
    # Test the endpoint
    if curl -f http://localhost:$BACKEND_PORT >/dev/null 2>&1; then
        log "✅ Backend endpoint is responding on port $BACKEND_PORT"
    elif curl -f http://localhost:$BACKEND_PORT/api >/dev/null 2>&1; then
        log "✅ Backend API endpoint is responding on port $BACKEND_PORT"
    else
        warning "⚠️ Backend is running but endpoint might not be configured"
        echo -e "${BLUE}Testing various endpoints:${NC}"
        curl -I http://localhost:$BACKEND_PORT 2>/dev/null || true
        curl -I http://localhost:$BACKEND_PORT/api 2>/dev/null || true
        curl -I http://localhost:$BACKEND_PORT/health 2>/dev/null || true
    fi
else
    error "❌ Backend is not listening on port $BACKEND_PORT"
    echo -e "${BLUE}Checking what ports are in use:${NC}"
    netstat -tlnp | grep node || true
    
    echo -e "${BLUE}Backend logs:${NC}"
    pm2 logs tradeai-backend --lines 20 --nostream || true
fi

# Update frontend PM2 config if it exists
step "Updating Frontend Configuration"
cd "$APP_DIR/frontend"

if [ -f "ecosystem.frontend.js" ]; then
    # Update frontend to use correct backend port in proxy settings
    log "Frontend PM2 config found - ensuring it's configured correctly"
    
    cat > ecosystem.frontend.js << EOF
module.exports = {
  apps: [{
    name: 'tradeai-frontend',
    script: 'npx',
    args: 'serve -s build -l 3000',
    cwd: '$APP_DIR/frontend',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      REACT_APP_API_URL: 'http://localhost:$BACKEND_PORT'
    },
    error_file: '/var/log/pm2/tradeai-frontend-error.log',
    out_file: '/var/log/pm2/tradeai-frontend-out.log',
    log_file: '/var/log/pm2/tradeai-frontend.log',
    time: true,
    max_memory_restart: '512M',
    restart_delay: 4000
  }]
};
EOF

    # Restart frontend
    pm2 restart tradeai-frontend 2>/dev/null || pm2 start ecosystem.frontend.js
fi

# Save PM2 configuration
pm2 save

# Final verification
step "Final Verification"
echo -e "${BLUE}PM2 Status:${NC}"
pm2 status

echo -e "${BLUE}Port Usage:${NC}"
netstat -tlnp | grep -E ":(3000|3001|5000)" || true

log "🎉 Backend port configuration fix completed!"
log "📝 Backend should now be running on port $BACKEND_PORT"
log "🔍 Check logs with: pm2 logs tradeai-backend"
log "🔄 Restart with: pm2 restart tradeai-backend"
log "🌐 Test endpoint: curl http://localhost:$BACKEND_PORT"