#!/bin/bash

# 🔍 TRADEAI Backend Diagnosis Script
# Diagnoses backend service issues after deployment

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

log "🔍 Starting TRADEAI Backend Diagnosis"

# Check PM2 status
step "Checking PM2 Status"
pm2 status

# Check PM2 logs
step "Checking PM2 Logs (Last 20 lines)"
echo -e "${BLUE}Backend Logs:${NC}"
pm2 logs ecosystem.backend --lines 20 --nostream || true

echo -e "${BLUE}Frontend Logs:${NC}"
pm2 logs ecosystem.frontend --lines 20 --nostream || true

# Check if backend port is listening
step "Checking Port $BACKEND_PORT"
if netstat -tlnp | grep ":$BACKEND_PORT "; then
    log "✅ Port $BACKEND_PORT is listening"
else
    error "❌ Port $BACKEND_PORT is not listening"
fi

# Check backend server file
step "Checking Backend Server File"
if [ -f "$APP_DIR/backend/src/server.js" ]; then
    log "✅ Backend server file exists"
    echo -e "${BLUE}First 20 lines of server.js:${NC}"
    head -20 "$APP_DIR/backend/src/server.js"
else
    error "❌ Backend server file not found at $APP_DIR/backend/src/server.js"
fi

# Check backend package.json
step "Checking Backend Package.json"
if [ -f "$APP_DIR/backend/package.json" ]; then
    log "✅ Backend package.json exists"
    echo -e "${BLUE}Backend package.json scripts:${NC}"
    cat "$APP_DIR/backend/package.json" | grep -A 10 '"scripts"' || true
else
    error "❌ Backend package.json not found"
fi

# Test backend endpoint
step "Testing Backend Endpoint"
echo -e "${BLUE}Testing http://localhost:$BACKEND_PORT${NC}"
curl -v http://localhost:$BACKEND_PORT 2>&1 || warning "Backend endpoint test failed"

echo -e "${BLUE}Testing http://localhost:$BACKEND_PORT/api/health${NC}"
curl -v http://localhost:$BACKEND_PORT/api/health 2>&1 || warning "Backend health endpoint test failed"

# Check node_modules
step "Checking Backend Dependencies"
if [ -d "$APP_DIR/backend/node_modules" ]; then
    log "✅ Backend node_modules exists"
    echo -e "${BLUE}Installed packages count: $(ls $APP_DIR/backend/node_modules | wc -l)${NC}"
else
    error "❌ Backend node_modules not found"
fi

# Check PM2 ecosystem file
step "Checking PM2 Ecosystem Configuration"
if [ -f "$APP_DIR/backend/ecosystem.backend.js" ]; then
    log "✅ Backend ecosystem file exists"
    echo -e "${BLUE}Backend ecosystem configuration:${NC}"
    cat "$APP_DIR/backend/ecosystem.backend.js"
else
    error "❌ Backend ecosystem file not found"
fi

# Check system resources
step "Checking System Resources"
echo -e "${BLUE}Memory Usage:${NC}"
free -h

echo -e "${BLUE}Disk Usage:${NC}"
df -h

echo -e "${BLUE}CPU Usage:${NC}"
top -bn1 | head -5

# Check processes
step "Checking Node Processes"
ps aux | grep node | grep -v grep || warning "No node processes found"

log "🔍 Backend diagnosis completed"

# Provide recommendations
step "Recommendations"
echo -e "${YELLOW}Based on the diagnosis above:${NC}"
echo -e "${BLUE}1. Check PM2 logs for specific error messages${NC}"
echo -e "${BLUE}2. Verify backend server.js has proper port configuration${NC}"
echo -e "${BLUE}3. Ensure all backend dependencies are installed${NC}"
echo -e "${BLUE}4. Check if backend server is binding to correct port${NC}"
echo -e "${BLUE}5. Verify no other service is using port $BACKEND_PORT${NC}"

echo -e "${GREEN}To restart backend service:${NC}"
echo -e "${YELLOW}pm2 restart ecosystem.backend${NC}"

echo -e "${GREEN}To view live logs:${NC}"
echo -e "${YELLOW}pm2 logs ecosystem.backend${NC}"