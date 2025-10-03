#!/bin/bash

# 🔧 TRADEAI Backend Service Fix
# Fixes common backend service issues

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

log "🔧 Starting TRADEAI Backend Service Fix"

# Stop existing backend processes
step "Stopping Existing Backend Processes"
pm2 stop ecosystem.backend 2>/dev/null || true
pm2 delete ecosystem.backend 2>/dev/null || true

# Kill any processes on backend port
step "Clearing Port $BACKEND_PORT"
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true

# Check backend directory structure
step "Verifying Backend Structure"
cd "$APP_DIR/backend"

if [ ! -f "src/server.js" ]; then
    error "Backend server file not found at src/server.js"
    
    # Check for alternative locations
    if [ -f "server.js" ]; then
        warning "Found server.js in root, creating src directory"
        mkdir -p src
        mv server.js src/
    elif [ -f "app.js" ]; then
        warning "Found app.js, renaming to src/server.js"
        mkdir -p src
        mv app.js src/server.js
    elif [ -f "index.js" ]; then
        warning "Found index.js, renaming to src/server.js"
        mkdir -p src
        mv index.js src/server.js
    else
        error "No backend entry point found"
        exit 1
    fi
fi

# Reinstall backend dependencies if needed
step "Checking Backend Dependencies"
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    log "Reinstalling backend dependencies..."
    npm install --production --no-optional
fi

# Create improved PM2 ecosystem configuration
step "Creating Improved PM2 Configuration"
cat > ecosystem.backend.js << EOF
module.exports = {
  apps: [{
    name: 'tradeai-backend',
    script: 'src/server.js',
    cwd: '$APP_DIR/backend',
    instances: 1,  // Start with single instance for debugging
    exec_mode: 'fork',  // Use fork mode for better debugging
    env: {
      NODE_ENV: 'production',
      PORT: $BACKEND_PORT,
      HOST: '0.0.0.0'
    },
    error_file: '/var/log/pm2/tradeai-backend-error.log',
    out_file: '/var/log/pm2/tradeai-backend-out.log',
    log_file: '/var/log/pm2/tradeai-backend.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Ensure log directory exists
mkdir -p /var/log/pm2
chown -R www-data:www-data /var/log/pm2

# Check server.js for common issues
step "Checking Server.js Configuration"
if grep -q "process.env.PORT" src/server.js; then
    log "✅ Server uses PORT environment variable"
else
    warning "⚠️ Server might not be using PORT environment variable"
    echo -e "${BLUE}First 30 lines of server.js:${NC}"
    head -30 src/server.js
fi

# Start backend service
step "Starting Backend Service"
pm2 start ecosystem.backend.js

# Wait for service to start
sleep 5

# Check if service is running
step "Verifying Backend Service"
if pm2 list | grep -q "tradeai-backend.*online"; then
    log "✅ Backend service is running"
else
    error "❌ Backend service failed to start"
    echo -e "${BLUE}PM2 Status:${NC}"
    pm2 status
    echo -e "${BLUE}Backend Logs:${NC}"
    pm2 logs tradeai-backend --lines 20 --nostream
    exit 1
fi

# Test backend endpoint
step "Testing Backend Endpoint"
sleep 3  # Give service time to fully start

if curl -f http://localhost:$BACKEND_PORT >/dev/null 2>&1; then
    log "✅ Backend endpoint is responding"
elif curl -f http://localhost:$BACKEND_PORT/api >/dev/null 2>&1; then
    log "✅ Backend API endpoint is responding"
elif curl -f http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
    log "✅ Backend health endpoint is responding"
else
    warning "⚠️ Backend endpoint not responding, but service is running"
    echo -e "${BLUE}This might be normal if the backend doesn't have a root endpoint${NC}"
fi

# Check port binding
step "Verifying Port Binding"
if netstat -tlnp | grep ":$BACKEND_PORT "; then
    log "✅ Backend is listening on port $BACKEND_PORT"
else
    warning "⚠️ Backend might not be listening on port $BACKEND_PORT"
    echo -e "${BLUE}All listening ports:${NC}"
    netstat -tlnp | grep node || true
fi

# Save PM2 configuration
pm2 save

log "🎉 Backend service fix completed!"
log "📝 Check logs with: pm2 logs tradeai-backend"
log "🔄 Restart with: pm2 restart tradeai-backend"
log "📊 Status with: pm2 status"