#!/bin/bash

# TRADEAI Production Build Script
# Creates optimized production build

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
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if we're in the right directory
check_directory() {
    if [[ ! -f "package.json" ]] || [[ ! -d "frontend" ]] || [[ ! -d "backend" ]]; then
        error "Please run this script from the TRADEAI root directory"
    fi
}

# Clean previous builds
clean_builds() {
    header "Cleaning Previous Builds"
    
    log "Removing old build files..."
    rm -rf frontend/build
    rm -rf backend/dist
    rm -rf node_modules
    rm -rf frontend/node_modules
    rm -rf backend/node_modules
    
    log "Cleaning npm cache..."
    npm cache clean --force
    
    info "Build cleanup completed"
}

# Install production dependencies
install_dependencies() {
    header "Installing Production Dependencies"
    
    log "Installing backend dependencies..."
    cd backend
    npm ci --only=production
    
    log "Installing frontend dependencies..."
    cd ../frontend
    npm ci
    
    cd ..
    info "Dependencies installed successfully"
}

# Build frontend for production
build_frontend() {
    header "Building Frontend for Production"
    
    cd frontend
    
    log "Creating production environment file..."
    cat > .env.production << 'EOF'
REACT_APP_API_URL=https://tradeai.gonxt.tech/api
REACT_APP_SOCKET_URL=https://tradeai.gonxt.tech
REACT_APP_AI_API_URL=https://tradeai.gonxt.tech/ai
REACT_APP_MONITORING_URL=https://tradeai.gonxt.tech/monitoring
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
IMAGE_INLINE_SIZE_LIMIT=0
EOF
    
    log "Building optimized production bundle..."
    npm run build
    
    log "Analyzing build size..."
    if command -v du &> /dev/null; then
        BUILD_SIZE=$(du -sh build | cut -f1)
        info "Build size: $BUILD_SIZE"
    fi
    
    log "Optimizing build..."
    # Remove source maps if they exist
    find build -name "*.map" -delete
    
    # Compress static assets
    if command -v gzip &> /dev/null; then
        find build/static -name "*.js" -o -name "*.css" | while read file; do
            gzip -9 -c "$file" > "$file.gz"
        done
        log "Static assets compressed"
    fi
    
    cd ..
    info "Frontend build completed successfully"
}

# Validate build
validate_build() {
    header "Validating Production Build"
    
    log "Checking frontend build..."
    if [[ ! -d "frontend/build" ]]; then
        error "Frontend build directory not found"
    fi
    
    if [[ ! -f "frontend/build/index.html" ]]; then
        error "Frontend index.html not found"
    fi
    
    log "Checking static assets..."
    JS_FILES=$(find frontend/build/static/js -name "*.js" | wc -l)
    CSS_FILES=$(find frontend/build/static/css -name "*.css" | wc -l)
    
    info "JavaScript files: $JS_FILES"
    info "CSS files: $CSS_FILES"
    
    if [[ $JS_FILES -eq 0 ]]; then
        error "No JavaScript files found in build"
    fi
    
    if [[ $CSS_FILES -eq 0 ]]; then
        error "No CSS files found in build"
    fi
    
    log "Checking backend files..."
    if [[ ! -f "backend/server.js" ]]; then
        error "Backend server.js not found"
    fi
    
    if [[ ! -f "backend/package.json" ]]; then
        error "Backend package.json not found"
    fi
    
    info "Build validation completed successfully"
}

# Create production package
create_package() {
    header "Creating Production Package"
    
    log "Creating production archive..."
    tar -czf tradeai-production-$(date +%Y%m%d-%H%M%S).tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=*.log \
        --exclude=.env.local \
        --exclude=.env.development \
        --exclude=frontend/src \
        --exclude=frontend/public \
        --exclude=frontend/node_modules \
        --exclude=backend/node_modules \
        .
    
    info "Production package created successfully"
}

# Generate build report
generate_report() {
    header "Generating Build Report"
    
    REPORT_FILE="build-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > $REPORT_FILE << EOF
TRADEAI Production Build Report
Generated: $(date)

=== Build Information ===
Node.js Version: $(node --version)
NPM Version: $(npm --version)
Build Date: $(date)
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Git Branch: $(git branch --show-current 2>/dev/null || echo "N/A")

=== Frontend Build ===
Build Directory: frontend/build
Index File: $(ls -la frontend/build/index.html 2>/dev/null || echo "Not found")
Static Files: $(find frontend/build/static -type f | wc -l) files
Build Size: $(du -sh frontend/build 2>/dev/null | cut -f1 || echo "N/A")

JavaScript Files:
$(find frontend/build/static/js -name "*.js" -exec basename {} \; 2>/dev/null || echo "None found")

CSS Files:
$(find frontend/build/static/css -name "*.css" -exec basename {} \; 2>/dev/null || echo "None found")

=== Backend Information ===
Main File: backend/server.js
Package File: backend/package.json
Dependencies: $(cd backend && npm list --depth=0 --prod 2>/dev/null | grep -c "├\|└" || echo "N/A")

=== Environment Configuration ===
Production Config: .env.production
Frontend Config: frontend/.env.production

=== Security Checks ===
Source Maps: $(find frontend/build -name "*.map" | wc -l) files (should be 0)
Development Files: $(find . -name "*.dev.js" -o -name "*.development.js" | wc -l) files (should be 0)

=== Recommendations ===
- Ensure all environment variables are properly configured
- Test the build in a staging environment before deployment
- Verify SSL certificates are properly configured
- Check database connections and credentials
- Validate all API endpoints are accessible
- Test user authentication and authorization
- Verify file upload functionality
- Check email configuration if applicable

EOF
    
    log "Build report generated: $REPORT_FILE"
    cat $REPORT_FILE
}

# Main build function
main() {
    header "TRADEAI Production Build"
    
    log "Starting production build process..."
    
    check_directory
    clean_builds
    install_dependencies
    build_frontend
    validate_build
    create_package
    generate_report
    
    header "Production Build Complete!"
    
    echo -e "${GREEN}🎉 Production build completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Build Summary:${NC}"
    echo -e "   📁 Frontend build: ${YELLOW}frontend/build${NC}"
    echo -e "   📦 Production package: ${YELLOW}tradeai-production-*.tar.gz${NC}"
    echo -e "   📊 Build report: ${YELLOW}build-report-*.txt${NC}"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo -e "   1. Copy the deployment script to your server"
    echo -e "   2. Run: ${YELLOW}sudo bash deploy-production.sh${NC}"
    echo -e "   3. Test the deployment at: ${YELLOW}https://tradeai.gonxt.tech${NC}"
    echo ""
    echo -e "${GREEN}✅ Ready for production deployment!${NC}"
}

# Handle script interruption
trap 'error "Build process interrupted"' INT TERM

# Run main function
main "$@"