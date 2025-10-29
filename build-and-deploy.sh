#!/bin/bash
#
# TradeAI - Complete Build & Deployment Script
# ============================================
#
# This script handles:
# 1. Frontend build
# 2. Dependency installation  
# 3. Production deployment
# 4. Service restart
# 5. Automated testing
#
# Usage:
#   ./build-and-deploy.sh         # Build only
#   ./build-and-deploy.sh test    # Build + Test
#   ./build-and-deploy.sh deploy  # Build + Deploy to production
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
BUILD_DIR="frontend/build"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Print header
print_header() {
    echo -e "\n${BOLD}${CYAN}======================================================================${NC}"
    echo -e "${BOLD}${CYAN}$1${NC}"
    echo -e "${BOLD}${CYAN}======================================================================${NC}\n"
}

# Print step
print_step() {
    echo -e "${BOLD}${BLUE}➜${NC} $1"
}

# Print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Pre-flight checks
preflight_checks() {
    print_header "🔍 PRE-FLIGHT CHECKS"
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed"
        echo "  Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm installed: $NPM_VERSION"
    else
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check if frontend directory exists
    if [ -d "$FRONTEND_DIR" ]; then
        print_success "Frontend directory found"
    else
        print_error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi
    
    # Check if package.json exists
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        print_success "package.json found"
    else
        print_error "package.json not found in $FRONTEND_DIR"
        exit 1
    fi
}

# Step 2: Install dependencies
install_dependencies() {
    print_header "📦 INSTALLING DEPENDENCIES"
    
    cd $FRONTEND_DIR
    print_step "Running npm install..."
    
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
    
    cd ..
}

# Step 3: Build frontend
build_frontend() {
    print_header "🏗️  BUILDING FRONTEND"
    
    cd $FRONTEND_DIR
    print_step "Running production build..."
    
    # Set Node options for memory
    export NODE_OPTIONS="--max-old-space-size=4096"
    
    if npm run build; then
        print_success "Frontend built successfully"
        
        # Check build output
        if [ -d "build" ]; then
            BUILD_SIZE=$(du -sh build | cut -f1)
            print_success "Build directory created: $BUILD_SIZE"
            
            # Count files
            FILE_COUNT=$(find build -type f | wc -l)
            print_success "Total files: $FILE_COUNT"
        else
            print_error "Build directory not created"
            exit 1
        fi
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    cd ..
}

# Step 4: Verify build
verify_build() {
    print_header "✅ VERIFYING BUILD"
    
    # Check for critical files
    CRITICAL_FILES=(
        "$BUILD_DIR/index.html"
        "$BUILD_DIR/static/js/main.*.js"
        "$BUILD_DIR/static/css/main.*.css"
    )
    
    for pattern in "${CRITICAL_FILES[@]}"; do
        if compgen -G "$pattern" > /dev/null; then
            print_success "Found: $pattern"
        else
            print_error "Missing: $pattern"
            exit 1
        fi
    done
    
    # Check bundle sizes
    print_step "Bundle sizes:"
    if [ -d "$BUILD_DIR/static/js" ]; then
        for file in $BUILD_DIR/static/js/*.js; do
            SIZE=$(du -h "$file" | cut -f1)
            echo "  📦 $(basename $file): $SIZE"
        done
    fi
}

# Step 5: Run tests
run_tests() {
    print_header "🧪 RUNNING AUTOMATED TESTS"
    
    if [ -f "automated-test-suite.py" ]; then
        print_step "Executing test suite..."
        python3 automated-test-suite.py || print_warning "Some tests failed (check report)"
    else
        print_warning "Test suite not found, skipping tests"
    fi
}

# Step 6: Backup current production (if exists)
backup_production() {
    print_header "💾 BACKING UP PRODUCTION"
    
    if [ -d "/home/ubuntu/tradeai-repo/frontend/build" ]; then
        BACKUP_DIR="/home/ubuntu/tradeai-backups/build_$TIMESTAMP"
        print_step "Creating backup at $BACKUP_DIR"
        
        mkdir -p /home/ubuntu/tradeai-backups
        cp -r /home/ubuntu/tradeai-repo/frontend/build "$BACKUP_DIR"
        
        print_success "Backup created"
    else
        print_warning "No existing production build to backup"
    fi
}

# Step 7: Deploy to production
deploy_production() {
    print_header "🚀 DEPLOYING TO PRODUCTION"
    
    print_step "Deploying build files..."
    
    # This would be run on production server
    if [ -d "/home/ubuntu/tradeai-repo" ]; then
        # Copy build files
        cp -r $BUILD_DIR/* /home/ubuntu/tradeai-repo/frontend/build/
        
        print_success "Files deployed"
        
        # Restart services
        print_step "Restarting services..."
        pm2 restart tradeai-frontend || print_warning "PM2 restart failed (may not be configured)"
        
        print_success "Deployment complete"
    else
        print_warning "Production directory not found - skipping deployment"
        print_warning "Build is ready in: $BUILD_DIR"
    fi
}

# Step 8: Post-deployment tests
post_deployment_tests() {
    print_header "🔬 POST-DEPLOYMENT TESTS"
    
    print_step "Testing production endpoints..."
    
    # Test homepage
    if curl -s -o /dev/null -w "%{http_code}" https://tradeai.gonxt.tech | grep -q "200"; then
        print_success "Homepage accessible"
    else
        print_error "Homepage not accessible"
    fi
    
    # Test API
    if curl -s -o /dev/null -w "%{http_code}" https://tradeai.gonxt.tech/api/health | grep -q "200"; then
        print_success "API accessible"
    else
        print_error "API not accessible"
    fi
}

# Main execution
main() {
    echo -e "${BOLD}${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                   ║"
    echo "║           TradeAI - Build & Deployment Script                     ║"
    echo "║                                                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    MODE=${1:-build}
    
    echo -e "${BOLD}Mode:${NC} $MODE"
    echo -e "${BOLD}Timestamp:${NC} $(date '+%Y-%m-%d %H:%M:%S')\n"
    
    # Always run these
    preflight_checks
    install_dependencies
    build_frontend
    verify_build
    
    # Conditional steps
    case "$MODE" in
        test)
            run_tests
            ;;
        deploy)
            backup_production
            deploy_production
            post_deployment_tests
            ;;
        full)
            run_tests
            backup_production
            deploy_production
            post_deployment_tests
            ;;
        *)
            print_warning "Build complete. Run with 'test' or 'deploy' for additional steps."
            ;;
    esac
    
    # Final summary
    print_header "📊 BUILD SUMMARY"
    echo -e "${GREEN}✅ Build completed successfully${NC}"
    echo -e "${BOLD}Build location:${NC} $BUILD_DIR"
    echo -e "${BOLD}Build size:${NC} $(du -sh $BUILD_DIR | cut -f1)"
    echo -e "${BOLD}Completed at:${NC} $(date '+%Y-%m-%d %H:%M:%S')\n"
    
    if [ "$MODE" == "build" ]; then
        echo -e "${YELLOW}Next steps:${NC}"
        echo -e "  1. Test locally: ${CYAN}npm start${NC} (in frontend directory)"
        echo -e "  2. Run tests: ${CYAN}./build-and-deploy.sh test${NC}"
        echo -e "  3. Deploy: ${CYAN}./build-and-deploy.sh deploy${NC}"
    fi
    
    echo ""
}

# Run main function
main "$@"
