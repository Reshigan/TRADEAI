#!/bin/bash

# 🔧 TRADEAI Quick Deployment Fix
# Fixes the npm install issue for existing deployment
# Run this if you already have the repository cloned but npm install failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root (use sudo)"
    exit 1
fi

log "🔧 Starting TRADEAI Quick Deployment Fix"

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    error "Application directory $APP_DIR not found"
    error "Please run the full deployment script first"
    exit 1
fi

cd "$APP_DIR"

# Check repository structure
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "Invalid repository structure - missing backend or frontend directories"
    exit 1
fi

if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    error "Missing package.json files in backend or frontend directories"
    exit 1
fi

log "Repository structure verified"

# Install backend dependencies
log "Installing backend dependencies..."
cd "$APP_DIR/backend"
npm install --production --no-optional

# Verify backend structure
if [ ! -f "src/server.js" ]; then
    error "Backend server file not found at backend/src/server.js"
    exit 1
fi

log "Backend dependencies installed successfully"

# Install frontend dependencies
log "Installing frontend dependencies..."
cd "$APP_DIR/frontend"
npm install

log "Frontend dependencies installed successfully"

# Build frontend for production
log "Building frontend for production..."
npm run build

# Verify frontend build
if [ ! -d "build" ]; then
    error "Frontend build failed - build directory not found"
    exit 1
fi

log "Frontend built successfully"

# Set proper permissions
cd "$APP_DIR"
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"

log "Permissions set correctly"

# Install serve globally for frontend
log "Installing serve package globally..."
npm install -g serve

log "🎉 Quick deployment fix completed successfully!"
log "📝 Next steps:"
log "   1. Configure and start your backend service (PM2)"
log "   2. Configure and start your frontend service (PM2)"
log "   3. Configure Nginx"
log "   4. Set up SSL certificates"
log ""
log "💡 Or run the full corrected deployment script: ./PRODUCTION_DEPLOY_FIXED_CORRECTED.sh"