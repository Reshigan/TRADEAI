#!/bin/bash

# TRADEAI Quick Deployment Fix Script
# Run this script on the production server to fix deployment issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]] && ! groups | grep -q docker; then
        error "This script must be run as root or with sudo, or user must be in docker group"
    fi
}

# Find project directory
find_project_dir() {
    POSSIBLE_DIRS=("/opt/tradeai" "/home/ubuntu/tradeai" "/var/www/tradeai" "$(pwd)")
    
    for dir in "${POSSIBLE_DIRS[@]}"; do
        if [[ -d "$dir" && -f "$dir/docker-compose.yml" ]]; then
            PROJECT_DIR="$dir"
            info "Found project directory: $PROJECT_DIR"
            return 0
        fi
    done
    
    error "Could not find TRADEAI project directory. Please run this script from the project root."
}

# Pull latest changes
pull_changes() {
    header "Pulling Latest Changes"
    
    cd "$PROJECT_DIR"
    
    if git status &>/dev/null; then
        log "Pulling latest changes from repository..."
        git fetch origin
        git pull origin main
        log "✅ Repository updated"
    else
        warn "Not a git repository or git not available"
    fi
}

# Fix SSL certificate
fix_ssl() {
    header "Checking SSL Certificate"
    
    # Check if certbot is available
    if command -v certbot &> /dev/null; then
        log "Attempting to renew SSL certificate..."
        
        # Try to renew certificate
        if certbot renew --nginx --quiet; then
            log "✅ SSL certificate renewed successfully"
            systemctl reload nginx 2>/dev/null || docker compose restart nginx
        else
            warn "SSL certificate renewal failed. You may need to run: certbot --nginx -d tradeai.gonxt.tech"
        fi
    else
        warn "Certbot not found. SSL certificate needs manual attention."
    fi
}

# Rebuild frontend
rebuild_frontend() {
    header "Rebuilding Frontend"
    
    cd "$PROJECT_DIR"
    
    log "Stopping frontend container..."
    docker compose down frontend 2>/dev/null || true
    
    log "Removing old frontend image..."
    docker rmi trade-ai-frontend 2>/dev/null || true
    
    log "Building new frontend image..."
    docker compose build --no-cache frontend
    
    log "Starting frontend container..."
    docker compose up -d frontend
    
    log "✅ Frontend rebuilt and started"
}

# Restart services
restart_services() {
    header "Restarting Services"
    
    cd "$PROJECT_DIR"
    
    log "Restarting nginx..."
    docker compose restart nginx
    
    log "Checking service status..."
    docker compose ps
    
    log "✅ Services restarted"
}

# Verify deployment
verify_deployment() {
    header "Verifying Deployment"
    
    log "Waiting for services to start..."
    sleep 15
    
    # Check if services are running
    if docker compose ps | grep -q "Up"; then
        log "✅ Docker services are running"
    else
        error "❌ Some Docker services are not running"
    fi
    
    # Test frontend
    log "Testing frontend..."
    if curl -f -s -k https://tradeai.gonxt.tech > /dev/null; then
        log "✅ Frontend is accessible"
        
        # Check build version
        BUILD_VERSION=$(curl -s -k https://tradeai.gonxt.tech | grep -o 'main\.[a-f0-9]*\.js' | head -1)
        if [[ -n "$BUILD_VERSION" ]]; then
            log "✅ Frontend build version: $BUILD_VERSION"
        fi
    else
        warn "❌ Frontend accessibility test failed"
    fi
    
    # Test backend API
    log "Testing backend API..."
    if curl -f -s -k https://tradeai.gonxt.tech/api/v1/health > /dev/null; then
        log "✅ Backend API is accessible"
    else
        warn "❌ Backend API test failed"
    fi
    
    # Test SSL certificate
    log "Testing SSL certificate..."
    if curl -I -s https://tradeai.gonxt.tech 2>&1 | grep -q "200 OK"; then
        log "✅ HTTPS is working"
    else
        warn "❌ HTTPS/SSL test failed"
    fi
}

# Main function
main() {
    header "TRADEAI Quick Deployment Fix"
    
    log "Starting deployment fix process..."
    
    check_permissions
    find_project_dir
    pull_changes
    fix_ssl
    rebuild_frontend
    restart_services
    verify_deployment
    
    header "Deployment Fix Complete!"
    
    echo -e "${GREEN}🎉 TRADEAI deployment fix completed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo -e "   1. Test the website: ${YELLOW}https://tradeai.gonxt.tech${NC}"
    echo -e "   2. Verify all features are working"
    echo -e "   3. Check browser console for any errors"
    echo ""
    echo -e "${BLUE}🔧 If issues persist:${NC}"
    echo -e "   1. Check logs: ${YELLOW}docker compose logs -f${NC}"
    echo -e "   2. Restart all services: ${YELLOW}docker compose restart${NC}"
    echo -e "   3. Full rebuild: ${YELLOW}docker compose down && docker compose up -d --build${NC}"
    echo ""
    log "Deployment fix process completed successfully!"
}

# Handle script interruption
trap 'error "Deployment fix interrupted"' INT TERM

# Run main function
main "$@"