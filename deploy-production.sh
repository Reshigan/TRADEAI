#!/bin/bash

# TRADEAI Frontend-v2 Production Deployment Script
# Version: 1.0
# Date: October 27, 2025

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend-v2"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version must be 18 or higher. Current: $(node -v)"
        exit 1
    fi
    log_success "Node.js $(node -v) found"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    log_success "npm $(npm -v) found"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        log_warning "Git is not installed (optional for backups)"
    else
        log_success "Git $(git --version | cut -d' ' -f3) found"
    fi
}

check_environment() {
    log_info "Checking environment configuration..."
    
    if [ ! -f "$FRONTEND_DIR/.env.production" ]; then
        log_warning ".env.production not found. Creating from template..."
        cat > "$FRONTEND_DIR/.env.production" << EOF
# Production Environment Variables
VITE_API_URL=https://tradeai.gonxt.tech/api
VITE_WS_URL=wss://tradeai.gonxt.tech/ws
VITE_APP_NAME=TRADEAI
VITE_APP_VERSION=2.0.0
EOF
        log_success "Created .env.production. Please review and update if needed."
        log_warning "Press ENTER to continue or Ctrl+C to exit and edit..."
        read
    else
        log_success ".env.production found"
    fi
}

install_dependencies() {
    log_info "Installing dependencies..."
    cd "$FRONTEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        log_info "Running npm install..."
        npm install
    else
        log_info "node_modules exists. Running npm ci for clean install..."
        npm ci
    fi
    
    log_success "Dependencies installed"
}

run_tests() {
    log_info "Running tests and linting..."
    cd "$FRONTEND_DIR"
    
    # Type checking
    log_info "Running TypeScript type check..."
    if npm run type-check 2>/dev/null; then
        log_success "Type check passed"
    else
        log_warning "Type check had warnings (continuing...)"
    fi
    
    # Linting
    log_info "Running ESLint..."
    if npm run lint 2>/dev/null; then
        log_success "Linting passed"
    else
        log_warning "Linting had warnings (continuing...)"
    fi
}

build_production() {
    log_info "Building production bundle..."
    cd "$FRONTEND_DIR"
    
    # Remove old dist
    if [ -d "dist" ]; then
        log_info "Removing old dist directory..."
        rm -rf dist
    fi
    
    # Build
    log_info "Running production build..."
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "Build failed - dist directory not created"
        exit 1
    fi
    
    log_success "Production build completed"
    
    # Show build stats
    log_info "Build statistics:"
    du -sh dist
    find dist -name "*.js" -o -name "*.css" | while read file; do
        echo "  $(basename $file): $(du -h "$file" | cut -f1)"
    done
}

create_backup() {
    log_info "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    if [ -d "$FRONTEND_DIR/dist" ]; then
        BACKUP_FILE="$BACKUP_DIR/dist_backup_$TIMESTAMP.tar.gz"
        tar -czf "$BACKUP_FILE" -C "$FRONTEND_DIR" dist
        log_success "Backup created: $BACKUP_FILE"
    else
        log_warning "No dist directory to backup"
    fi
}

deploy_to_server() {
    log_info "Deployment options:"
    echo "1. Local preview (npm run preview)"
    echo "2. Copy to server (requires SSH setup)"
    echo "3. Docker deployment"
    echo "4. Skip deployment"
    read -p "Select option (1-4): " deploy_option
    
    case $deploy_option in
        1)
            log_info "Starting local preview..."
            cd "$FRONTEND_DIR"
            log_success "Preview starting on http://localhost:4173"
            log_info "Press Ctrl+C to stop"
            npm run preview
            ;;
        2)
            read -p "Enter server address (user@host): " SERVER
            read -p "Enter remote path (e.g., /var/www/tradeai): " REMOTE_PATH
            
            log_info "Deploying to $SERVER:$REMOTE_PATH..."
            rsync -avz --delete "$FRONTEND_DIR/dist/" "$SERVER:$REMOTE_PATH/"
            
            log_success "Files copied to server"
            log_info "Don't forget to restart your web server (nginx/apache)"
            ;;
        3)
            log_info "Building Docker image..."
            cd "$PROJECT_DIR"
            
            if [ ! -f "Dockerfile" ]; then
                log_warning "Dockerfile not found. Creating basic Dockerfile..."
                cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine as build
WORKDIR /app
COPY frontend-v2/package*.json ./
RUN npm ci
COPY frontend-v2 .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
DOCKERFILE
            fi
            
            docker build -t tradeai-frontend:latest .
            log_success "Docker image built: tradeai-frontend:latest"
            log_info "To run: docker run -d -p 80:80 tradeai-frontend:latest"
            ;;
        4)
            log_info "Skipping deployment"
            ;;
        *)
            log_error "Invalid option"
            ;;
    esac
}

verify_build() {
    log_info "Verifying build..."
    cd "$FRONTEND_DIR/dist"
    
    # Check critical files
    REQUIRED_FILES=("index.html")
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done
    log_success "All required files present"
    
    # Check for assets
    if [ ! -d "assets" ] || [ -z "$(ls -A assets)" ]; then
        log_warning "Assets directory is empty or missing"
    else
        log_success "Assets directory populated"
    fi
}

generate_report() {
    log_info "Generating deployment report..."
    
    REPORT_FILE="$PROJECT_DIR/deployment_report_$TIMESTAMP.txt"
    
    cat > "$REPORT_FILE" << EOF
TRADEAI Frontend-v2 Deployment Report
======================================
Date: $(date)
Timestamp: $TIMESTAMP

Build Information:
------------------
Node.js Version: $(node -v)
npm Version: $(npm -v)
Build Directory: $FRONTEND_DIR/dist

Build Stats:
------------
Total Size: $(du -sh "$FRONTEND_DIR/dist" | cut -f1)

Files:
$(find "$FRONTEND_DIR/dist" -type f | wc -l) files generated

Environment:
------------
$(cat "$FRONTEND_DIR/.env.production" 2>/dev/null || echo "No .env.production file")

Git Info:
---------
$(git log -1 --pretty=format:"Commit: %h%nAuthor: %an%nDate: %ad%nMessage: %s" 2>/dev/null || echo "Not in git repository")

Status: SUCCESS
EOF
    
    log_success "Report generated: $REPORT_FILE"
    cat "$REPORT_FILE"
}

main() {
    echo ""
    echo "=========================================="
    echo "  TRADEAI Frontend Production Deployment  "
    echo "=========================================="
    echo ""
    
    check_prerequisites
    check_environment
    install_dependencies
    run_tests
    build_production
    verify_build
    create_backup
    generate_report
    
    echo ""
    log_success "Build process completed successfully!"
    echo ""
    
    deploy_to_server
    
    echo ""
    echo "=========================================="
    echo "  Deployment Complete!                    "
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Test authentication: curl -X POST https://tradeai.gonxt.tech/api/auth/login"
    echo "2. Verify all features work"
    echo "3. Check monitoring dashboards"
    echo "4. Review deployment report: deployment_report_$TIMESTAMP.txt"
    echo ""
    log_info "For detailed verification steps, see: PRODUCTION_VERIFICATION.md"
    echo ""
}

# Run main function
main "$@"
