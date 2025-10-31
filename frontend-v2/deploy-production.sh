#!/bin/bash

###############################################################################
# Enterprise Production Deployment Script for Trade AI Frontend
# Version: 2.0
# Description: Zero-downtime deployment with health checks and rollback capability
###############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_USER="ubuntu"
REMOTE_HOST="3.10.212.143"
SSH_KEY="${SSH_KEY:-Vantax-2.pem}"
REMOTE_PATH="/var/www/tradeai/frontend-v2"
TEMP_PATH="/var/www/tradeai/frontend-v2-temp"
BACKUP_PATH="/var/www/tradeai/backups/frontend-v2-$(date +%Y%m%d-%H%M%S)"
HEALTH_CHECK_URL="https://tradeai.gonxt.tech"
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_DELAY=2

# Functions
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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if SSH key exists
    if [ ! -f "../$SSH_KEY" ] && [ ! -f "../../$SSH_KEY" ] && [ ! -f "/workspace/project/$SSH_KEY" ]; then
        log_error "SSH key not found: $SSH_KEY"
        exit 1
    fi
    
    # Find SSH key location
    if [ -f "../$SSH_KEY" ]; then
        SSH_KEY_PATH="../$SSH_KEY"
    elif [ -f "../../$SSH_KEY" ]; then
        SSH_KEY_PATH="../../$SSH_KEY"
    elif [ -f "/workspace/project/$SSH_KEY" ]; then
        SSH_KEY_PATH="/workspace/project/$SSH_KEY"
    fi
    
    log_success "Prerequisites check passed"
}

build_frontend() {
    log_info "Building frontend for production..."
    
    # Clean previous builds
    npm run clean || true
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm ci --production=false
    fi
    
    # Run production build
    log_info "Running production build..."
    npm run build:prod
    
    # Verify build output
    if [ ! -d "build" ]; then
        log_error "Build failed: 'build' directory not found"
        exit 1
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh build | cut -f1)
    log_success "Build completed successfully (Size: $BUILD_SIZE)"
    
    # List build assets
    log_info "Build assets:"
    ls -lh build/assets/ | tail -n +2
}

create_backup() {
    log_info "Creating backup of current deployment..."
    
    ssh -i "$SSH_KEY_PATH" "$REMOTE_USER@$REMOTE_HOST" << EOF
        if [ -d "$REMOTE_PATH" ]; then
            sudo mkdir -p $(dirname "$BACKUP_PATH")
            sudo cp -r "$REMOTE_PATH" "$BACKUP_PATH"
            echo "Backup created at: $BACKUP_PATH"
        else
            echo "No existing deployment to backup"
        fi
EOF
    
    log_success "Backup created successfully"
}

upload_build() {
    log_info "Uploading build to server..."
    
    # Create archive
    tar -czf build.tar.gz -C build .
    
    # Upload archive
    scp -i "$SSH_KEY_PATH" build.tar.gz "$REMOTE_USER@$REMOTE_HOST:/tmp/"
    
    # Extract on server
    ssh -i "$SSH_KEY_PATH" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        # Extract to temp directory
        sudo mkdir -p /tmp/frontend-v2-new
        sudo tar -xzf /tmp/build.tar.gz -C /tmp/frontend-v2-new
        
        # Atomic swap with minimal downtime
        sudo rm -rf /var/www/tradeai/frontend-v2-old || true
        if [ -d "/var/www/tradeai/frontend-v2" ]; then
            sudo mv /var/www/tradeai/frontend-v2 /var/www/tradeai/frontend-v2-old
        fi
        sudo mv /tmp/frontend-v2-new /var/www/tradeai/frontend-v2
        
        # Set permissions
        sudo chown -R www-data:www-data /var/www/tradeai/frontend-v2
        sudo chmod -R 755 /var/www/tradeai/frontend-v2
        
        # Cleanup
        rm /tmp/build.tar.gz
EOF
    
    # Cleanup local archive
    rm build.tar.gz
    
    log_success "Build uploaded successfully"
}

health_check() {
    log_info "Running health checks..."
    
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        log_info "Health check attempt $i/$HEALTH_CHECK_RETRIES..."
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            log_success "Health check passed (HTTP $HTTP_CODE)"
            return 0
        fi
        
        log_warning "Health check failed (HTTP $HTTP_CODE), retrying in ${HEALTH_CHECK_DELAY}s..."
        sleep $HEALTH_CHECK_DELAY
    done
    
    log_error "Health check failed after $HEALTH_CHECK_RETRIES attempts"
    return 1
}

rollback() {
    log_warning "Rolling back to previous deployment..."
    
    ssh -i "$SSH_KEY_PATH" "$REMOTE_USER@$REMOTE_HOST" << EOF
        if [ -d "/var/www/tradeai/frontend-v2-old" ]; then
            sudo rm -rf /var/www/tradeai/frontend-v2
            sudo mv /var/www/tradeai/frontend-v2-old /var/www/tradeai/frontend-v2
            echo "Rollback completed"
        else
            echo "No previous deployment found for rollback"
            exit 1
        fi
EOF
    
    log_success "Rollback completed"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    
    ssh -i "$SSH_KEY_PATH" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        sudo rm -rf /var/www/tradeai/frontend-v2-old || true
        sudo rm -rf /tmp/frontend-v2-new || true
EOF
    
    log_success "Cleanup completed"
}

reload_nginx() {
    log_info "Reloading Nginx..."
    
    ssh -i "$SSH_KEY_PATH" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        sudo nginx -t && sudo systemctl reload nginx
EOF
    
    log_success "Nginx reloaded successfully"
}

print_deployment_info() {
    echo ""
    echo "=========================================="
    echo "  Deployment Information"
    echo "=========================================="
    echo "Environment: Production"
    echo "URL: $HEALTH_CHECK_URL"
    echo "Build Date: $(date)"
    echo "Deployed By: $(whoami)"
    echo "Backup Location: $BACKUP_PATH"
    echo "=========================================="
    echo ""
}

# Main deployment process
main() {
    log_info "Starting production deployment..."
    echo ""
    
    # Pre-deployment checks
    check_prerequisites
    
    # Build
    build_frontend
    
    # Backup
    create_backup
    
    # Deploy
    upload_build
    
    # Reload Nginx
    reload_nginx
    
    # Health check
    if health_check; then
        cleanup
        log_success "Deployment completed successfully!"
        print_deployment_info
    else
        log_error "Health check failed, initiating rollback..."
        rollback
        reload_nginx
        
        # Verify rollback worked
        if health_check; then
            log_success "Rollback successful, application is running"
        else
            log_error "Rollback failed, manual intervention required!"
        fi
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main deployment
main
