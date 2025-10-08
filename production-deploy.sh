#!/bin/bash

##############################################################################
# TRADEAI Production Deployment Script
# 
# This script automates the deployment process:
# 1. Pulls latest code from GitHub (no SCP)
# 2. Validates environment configuration
# 3. Installs/updates dependencies
# 4. Builds frontend with production settings
# 5. Deploys to nginx
# 6. Restarts backend
# 7. Verifies deployment
#
# Usage: ./production-deploy.sh
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/ubuntu/tradeai"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
NGINX_DIR="/var/www/tradeai"
BACKUP_DIR="/home/ubuntu/tradeai-backups"
GIT_BRANCH="main"

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to handle errors
handle_error() {
    print_error "Deployment failed at: $1"
    print_warning "Check logs above for details"
    exit 1
}

# Start deployment
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           TRADEAI PRODUCTION DEPLOYMENT                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Pull latest code from GitHub
print_step "Step 1: Pulling latest code from GitHub..."
cd "$PROJECT_DIR" || handle_error "Cannot access project directory"

# Check git status
if [ ! -d ".git" ]; then
    print_error "Not a git repository!"
    exit 1
fi

# Store current commit for rollback
CURRENT_COMMIT=$(git rev-parse HEAD)
print_success "Current commit: $CURRENT_COMMIT"

# Fetch and pull
git fetch origin "$GIT_BRANCH" || handle_error "Git fetch failed"
git pull origin "$GIT_BRANCH" || handle_error "Git pull failed"

NEW_COMMIT=$(git rev-parse HEAD)
print_success "Updated to commit: $NEW_COMMIT"

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    print_warning "No new changes detected"
fi

# Step 2: Validate environment files
print_step "Step 2: Validating environment configuration..."

# Check backend .env
if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_error "Backend .env file not found!"
    exit 1
fi
print_success "Backend .env exists"

# Validate required backend variables
required_backend_vars=("NODE_ENV" "PORT" "MONGODB_URI" "JWT_SECRET")
for var in "${required_backend_vars[@]}"; do
    if ! grep -q "^$var=" "$BACKEND_DIR/.env"; then
        print_error "Missing required variable: $var"
        exit 1
    fi
done
print_success "Backend environment validated"

# Check frontend .env.production
if [ ! -f "$FRONTEND_DIR/.env.production" ]; then
    print_error "Frontend .env.production file not found!"
    exit 1
fi
print_success "Frontend .env.production exists"

# Validate NODE_ENV=production in backend
if ! grep -q "^NODE_ENV=production" "$BACKEND_DIR/.env"; then
    print_warning "Backend NODE_ENV is not set to production!"
fi

# Step 3: Install/update backend dependencies
print_step "Step 3: Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install --production || handle_error "Backend npm install failed"
print_success "Backend dependencies installed"

# Step 4: Install/update frontend dependencies
print_step "Step 4: Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install || handle_error "Frontend npm install failed"
print_success "Frontend dependencies installed"

# Step 5: Build frontend with production environment
print_step "Step 5: Building frontend for production..."
cd "$FRONTEND_DIR"

# Backup existing build
if [ -d "build" ]; then
    print_step "Backing up previous build..."
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    tar -czf "$BACKUP_DIR/frontend-build-$TIMESTAMP.tar.gz" build/
    print_success "Backup created: frontend-build-$TIMESTAMP.tar.gz"
fi

# Build with production environment
NODE_ENV=production npm run build || handle_error "Frontend build failed"

# Verify build output
if [ ! -d "build" ]; then
    print_error "Build directory not created!"
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    print_error "build/index.html not found!"
    exit 1
fi

# Check build size
BUILD_SIZE=$(du -sh build | cut -f1)
print_success "Frontend built successfully (size: $BUILD_SIZE)"

# Step 6: Deploy to nginx
print_step "Step 6: Deploying frontend to nginx..."

# Backup current nginx deployment
if [ -d "$NGINX_DIR" ] && [ "$(ls -A $NGINX_DIR)" ]; then
    print_step "Backing up current deployment..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    sudo tar -czf "$BACKUP_DIR/nginx-deploy-$TIMESTAMP.tar.gz" -C "$NGINX_DIR" .
    print_success "Backup created: nginx-deploy-$TIMESTAMP.tar.gz"
fi

# Clear and deploy new build
sudo rm -rf "$NGINX_DIR"/*
sudo cp -r build/* "$NGINX_DIR"/
sudo chown -R www-data:www-data "$NGINX_DIR"
sudo chmod -R 755 "$NGINX_DIR"
print_success "Frontend deployed to $NGINX_DIR"

# Step 7: Restart backend via PM2
print_step "Step 7: Restarting backend..."
cd "$BACKEND_DIR"

# Check if PM2 process exists
if pm2 list | grep -q "tradeai-backend"; then
    pm2 restart tradeai-backend || handle_error "PM2 restart failed"
    print_success "Backend restarted"
else
    print_warning "PM2 process not found, starting new instance..."
    pm2 start src/server.js --name tradeai-backend || handle_error "PM2 start failed"
    pm2 save
    print_success "Backend started"
fi

# Wait for backend to be ready
print_step "Waiting for backend to be ready..."
sleep 3

# Step 8: Verify deployment
print_step "Step 8: Verifying deployment..."

# Check backend health
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5002/api/health || echo "000")
if [ "$BACKEND_STATUS" = "200" ]; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check returned: $BACKEND_STATUS"
fi

# Check nginx
if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running!"
    sudo systemctl start nginx
fi

# Check frontend is accessible
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend check returned: $FRONTEND_STATUS"
fi

# Step 9: Display deployment summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           DEPLOYMENT COMPLETED SUCCESSFULLY                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Deployment Summary:"
echo "  • Git Commit: $NEW_COMMIT"
echo "  • Frontend Build: $BUILD_SIZE"
echo "  • Backend Status: $(pm2 list | grep tradeai-backend | awk '{print $10}')"
echo "  • Nginx Status: $(sudo systemctl is-active nginx)"
echo ""
echo "🌐 Application URLs:"
echo "  • Production: https://tradeai.gonxt.tech"
echo "  • API: https://tradeai.gonxt.tech/api"
echo "  • Backend (local): http://localhost:5002"
echo ""
echo "📁 Backup Location: $BACKUP_DIR"
echo ""
echo "✅ Deployment completed at: $(date)"
echo ""
