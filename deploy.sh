#!/bin/bash

# ============================================================================
# TRADEAI Production Deployment Script
# ============================================================================
# Usage: ./deploy.sh [environment]
# Environments: production (default), staging
# ============================================================================

set -e

# Configuration
ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/workers-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

preflight_checks() {
    log_info "Running pre-flight checks..."
    
    # Check required commands
    check_command "node"
    check_command "npm"
    check_command "wrangler"
    
    # Check Wrangler authentication
    if ! wrangler whoami &> /dev/null; then
        log_error "Not authenticated with Cloudflare. Run 'wrangler login' first."
        exit 1
    fi
    
    # Check environment variables
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        log_warning "CLOUDFLARE_API_TOKEN not set. Using Wrangler's stored credentials."
    fi
    
    log_success "Pre-flight checks passed!"
}

# ============================================================================
# Deploy Backend
# ============================================================================

deploy_backend() {
    log_info "Deploying backend to Cloudflare Workers..."
    
    cd "$BACKEND_DIR"
    
    # Install dependencies
    log_info "Installing backend dependencies..."
    npm ci --production
    
    # Run database migrations
    log_info "Running database migrations..."
    wrangler d1 execute tradeai --remote --file migrations/0070_process_management.sql
    
    # Deploy worker
    log_info "Deploying worker..."
    wrangler deploy
    
    # Verify deployment
    log_info "Verifying backend deployment..."
    if curl -f https://tradeai-api.vantax.workers.dev/health &> /dev/null; then
        log_success "Backend deployed successfully!"
    else
        log_error "Backend health check failed!"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
}

# ============================================================================
# Deploy Frontend
# ============================================================================

deploy_frontend() {
    log_info "Deploying frontend to Cloudflare Pages..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm ci
    
    # Build frontend
    log_info "Building frontend..."
    export REACT_APP_API_URL="${REACT_APP_API_URL:-https://tradeai-api.vantax.workers.dev}"
    export REACT_APP_WS_URL="${REACT_APP_WS_URL:-wss://tradeai-api.vantax.workers.dev/ws}"
    npm run build
    
    # Deploy to Pages
    log_info "Deploying to Cloudflare Pages..."
    wrangler pages deploy dist --project-name=tradeai
    
    # Verify deployment
    log_info "Verifying frontend deployment..."
    if curl -f https://tradeai.vantax.co.za/health &> /dev/null; then
        log_success "Frontend deployed successfully!"
    else
        log_error "Frontend health check failed!"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
}

# ============================================================================
# Post-Deployment Verification
# ============================================================================

verify_deployment() {
    log_info "Running post-deployment verification..."
    
    # Test backend endpoints
    log_info "Testing backend endpoints..."
    
    # Health check
    if ! curl -f https://tradeai-api.vantax.workers.dev/health &> /dev/null; then
        log_error "Backend health check failed!"
        exit 1
    fi
    
    # Test frontend
    log_info "Testing frontend..."
    if ! curl -f https://tradeai.vantax.co.za/health &> /dev/null; then
        log_error "Frontend health check failed!"
        exit 1
    fi
    
    log_success "All verification tests passed!"
}

# ============================================================================
# Main Deployment
# ============================================================================

main() {
    echo "========================================"
    echo "  TRADEAI Production Deployment"
    echo "  Environment: $ENVIRONMENT"
    echo "========================================"
    echo ""
    
    # Run pre-flight checks
    preflight_checks
    echo ""
    
    # Deploy backend
    deploy_backend
    echo ""
    
    # Deploy frontend
    deploy_frontend
    echo ""
    
    # Verify deployment
    verify_deployment
    echo ""
    
    echo "========================================"
    log_success "Deployment completed successfully!"
    echo ""
    echo "Backend:  https://tradeai-api.vantax.workers.dev"
    echo "Frontend: https://tradeai.vantax.co.za"
    echo "========================================"
}

# Run main function
main "$@"
