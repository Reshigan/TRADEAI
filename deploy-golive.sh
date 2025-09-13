#!/bin/bash

# TRADEAI Go-Live Deployment Script
# Complete production deployment with cleanup and verification
# Version: 2.1.3

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.live.yml"
PROJECT_NAME="tradeai"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./deploy-$(date +%Y%m%d_%H%M%S).log"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_banner() {
    echo -e "${WHITE}"
    echo "████████╗██████╗  █████╗ ██████╗ ███████╗ █████╗ ██╗"
    echo "╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗██║"
    echo "   ██║   ██████╔╝███████║██║  ██║█████╗  ███████║██║"
    echo "   ██║   ██╔══██╗██╔══██║██║  ██║██╔══╝  ██╔══██║██║"
    echo "   ██║   ██║  ██║██║  ██║██████╔╝███████╗██║  ██║██║"
    echo "   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝"
    echo -e "${NC}"
    echo -e "${CYAN}Premium Corporate FMCG Trading Platform${NC}"
    echo -e "${CYAN}Go-Live Production Deployment v2.1.3${NC}"
    echo ""
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. This is not recommended for production."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Check system requirements
check_requirements() {
    print_header "System Requirements Check"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        print_status "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        print_success "Docker installed. Please log out and back in, then run this script again."
        exit 1
    else
        print_success "Docker is installed: $(docker --version)"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        print_status "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        print_success "Docker Compose installed"
    else
        print_success "Docker Compose is installed: $(docker-compose --version)"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        sudo apt-get update && sudo apt-get install -y git
        print_success "Git installed"
    else
        print_success "Git is installed: $(git --version)"
    fi
    
    # Check system resources
    print_status "Checking system resources..."
    
    # Memory check (minimum 2GB)
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$MEMORY_GB" -lt 2 ]; then
        print_warning "System has less than 2GB RAM. Performance may be affected."
    else
        print_success "Memory: ${MEMORY_GB}GB available"
    fi
    
    # Disk space check (minimum 10GB)
    DISK_GB=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$DISK_GB" -lt 10 ]; then
        print_warning "Less than 10GB disk space available. Consider freeing up space."
    else
        print_success "Disk space: ${DISK_GB}GB available"
    fi
    
    # Check if ports are available
    print_status "Checking port availability..."
    for port in 80 443 3000 5000 27017 6379; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_warning "Port $port is already in use"
            if [ "$port" = "80" ] || [ "$port" = "443" ]; then
                print_status "Attempting to stop services on port $port..."
                sudo systemctl stop apache2 2>/dev/null || true
                sudo systemctl stop nginx 2>/dev/null || true
            fi
        else
            print_success "Port $port is available"
        fi
    done
}

# Complete cleanup of previous deployments
cleanup_previous() {
    print_header "Cleaning Up Previous Deployments"
    
    # Stop and remove all TRADEAI containers
    print_status "Stopping all TRADEAI containers..."
    docker ps -a --filter "name=tradeai" --format "{{.Names}}" | while read container; do
        if [ ! -z "$container" ]; then
            print_status "Stopping container: $container"
            docker stop "$container" 2>/dev/null || true
            docker rm "$container" 2>/dev/null || true
        fi
    done
    
    # Stop Docker Compose services
    if [ -f "$COMPOSE_FILE" ]; then
        print_status "Stopping Docker Compose services..."
        docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
    fi
    
    # Remove TRADEAI images
    print_status "Removing old TRADEAI images..."
    docker images --filter "reference=tradeai*" --format "{{.Repository}}:{{.Tag}}" | while read image; do
        if [ ! -z "$image" ]; then
            print_status "Removing image: $image"
            docker rmi "$image" 2>/dev/null || true
        fi
    done
    
    # Clean up Docker system
    print_status "Cleaning up Docker system..."
    docker system prune -f --volumes 2>/dev/null || true
    
    # Remove old deployment files (but keep backups)
    print_status "Cleaning up old deployment files..."
    rm -f deploy-*.log 2>/dev/null || true
    rm -f docker-compose.override.yml 2>/dev/null || true
    
    # Kill any processes using our ports
    print_status "Freeing up ports..."
    for port in 3000 5000 27017 6379; do
        PID=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$PID" ]; then
            print_status "Killing process on port $port (PID: $PID)"
            kill -9 $PID 2>/dev/null || true
        fi
    done
    
    print_success "Cleanup completed"
}

# Create backup of existing data
create_backup() {
    print_header "Creating Backup"
    
    if [ -d "./data" ] || [ -d "./logs" ] || [ -d "./uploads" ]; then
        print_status "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        
        # Backup data directories
        [ -d "./data" ] && cp -r ./data "$BACKUP_DIR/" 2>/dev/null || true
        [ -d "./logs" ] && cp -r ./logs "$BACKUP_DIR/" 2>/dev/null || true
        [ -d "./uploads" ] && cp -r ./uploads "$BACKUP_DIR/" 2>/dev/null || true
        
        # Backup configuration files
        [ -f ".env" ] && cp .env "$BACKUP_DIR/" 2>/dev/null || true
        [ -f ".env.production" ] && cp .env.production "$BACKUP_DIR/" 2>/dev/null || true
        [ -f "docker-compose.yml" ] && cp docker-compose.yml "$BACKUP_DIR/" 2>/dev/null || true
        
        print_success "Backup created at: $BACKUP_DIR"
    else
        print_status "No existing data to backup"
    fi
}

# Ensure we have the latest code
update_codebase() {
    print_header "Updating Codebase"
    
    # Check if we're in a git repository
    if [ -d ".git" ]; then
        print_status "Fetching latest changes..."
        git fetch origin
        
        # Switch to the deployment branch
        print_status "Switching to premium-corporate-ui-deployment branch..."
        git checkout premium-corporate-ui-deployment
        git pull origin premium-corporate-ui-deployment
        
        print_success "Codebase updated to latest version"
    else
        print_warning "Not in a git repository. Make sure you have the latest code."
    fi
}

# Setup environment
setup_environment() {
    print_header "Setting Up Environment"
    
    # Create necessary directories
    print_status "Creating necessary directories..."
    mkdir -p ./backend/logs/security
    mkdir -p ./backend/uploads
    mkdir -p ./frontend/build
    mkdir -p ./nginx/ssl
    
    # Set proper permissions
    chmod -R 755 ./backend/logs 2>/dev/null || true
    chmod -R 755 ./backend/uploads 2>/dev/null || true
    
    # Create environment file if it doesn't exist
    if [ ! -f ".env.production" ]; then
        print_status "Creating production environment file..."
        cat > .env.production << EOF
# TRADEAI Production Environment
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://mongodb:27017/trade_ai_production

# Redis
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=tradeai-jwt-secret-2024-production-$(openssl rand -hex 32)
SESSION_SECRET=tradeai-session-secret-2024-production-$(openssl rand -hex 32)

# CORS
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000

# Rate Limiting
API_RATE_LIMIT=1000

# Logging
LOG_LEVEL=info
DISABLE_SECURITY_LOGS=true

# Features
DISABLE_REDIS=false
EOF
        print_success "Environment file created"
    else
        print_success "Environment file already exists"
    fi
}

# Build and deploy services
deploy_services() {
    print_header "Building and Deploying Services"
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    # Build services
    print_status "Building Docker images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache --parallel
    
    # Start services
    print_status "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    print_success "Services deployed"
}

# Wait for services to be ready
wait_for_services() {
    print_header "Waiting for Services to be Ready"
    
    # Wait for MongoDB
    print_status "Waiting for MongoDB to be ready..."
    for i in {1..30}; do
        if docker exec tradeai_mongodb_live mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            print_success "MongoDB is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "MongoDB failed to start within 150 seconds"
            return 1
        fi
        sleep 5
    done
    
    # Wait for Redis
    print_status "Waiting for Redis to be ready..."
    for i in {1..20}; do
        if docker exec tradeai_redis_live redis-cli ping >/dev/null 2>&1; then
            print_success "Redis is ready"
            break
        fi
        if [ $i -eq 20 ]; then
            print_error "Redis failed to start within 100 seconds"
            return 1
        fi
        sleep 5
    done
    
    # Wait for Backend API
    print_status "Waiting for Backend API to be ready..."
    for i in {1..40}; do
        if curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
            print_success "Backend API is ready"
            break
        fi
        if [ $i -eq 40 ]; then
            print_error "Backend API failed to start within 200 seconds"
            print_status "Checking backend logs..."
            docker logs --tail 20 tradeai_backend_live
            return 1
        fi
        sleep 5
    done
    
    # Wait for Frontend
    print_status "Waiting for Frontend to be ready..."
    for i in {1..20}; do
        if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "Frontend is ready"
            break
        fi
        if [ $i -eq 20 ]; then
            print_error "Frontend failed to start within 100 seconds"
            return 1
        fi
        sleep 5
    done
}

# Seed database
seed_database() {
    print_header "Seeding Database"
    
    print_status "Running database seeding..."
    if docker exec tradeai_backend_live npm run seed:clean; then
        print_success "Database seeded successfully"
    else
        print_warning "Clean seeding failed, trying alternative method..."
        if docker exec tradeai_backend_live npm run seed:production; then
            print_success "Database seeded with alternative method"
        else
            print_warning "Database seeding failed, but continuing..."
        fi
    fi
}

# Run health checks
run_health_checks() {
    print_header "Running Health Checks"
    
    # Check all containers are running
    print_status "Checking container status..."
    CONTAINERS=("tradeai_mongodb_live" "tradeai_redis_live" "tradeai_backend_live" "tradeai_frontend_live")
    
    for container in "${CONTAINERS[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            print_success "$container is running"
        else
            print_error "$container is not running"
            return 1
        fi
    done
    
    # Test API endpoints
    print_status "Testing API endpoints..."
    
    # Health endpoint
    if curl -f -s http://localhost:5000/api/health | grep -q "ok"; then
        print_success "Health endpoint is working"
    else
        print_error "Health endpoint is not responding"
        return 1
    fi
    
    # Frontend
    if curl -f -s http://localhost:3000 | grep -q "TRADEAI"; then
        print_success "Frontend is serving content"
    else
        print_error "Frontend is not serving content properly"
        return 1
    fi
    
    # Database connectivity
    if docker exec tradeai_backend_live node -e "
        const mongoose = require('mongoose');
        mongoose.connect('mongodb://mongodb:27017/trade_ai_production')
        .then(() => { console.log('DB OK'); process.exit(0); })
        .catch(() => process.exit(1));
    " 2>/dev/null; then
        print_success "Database connectivity is working"
    else
        print_error "Database connectivity failed"
        return 1
    fi
    
    print_success "All health checks passed"
}

# Setup monitoring and logging
setup_monitoring() {
    print_header "Setting Up Monitoring"
    
    # Create monitoring script
    cat > monitor-tradeai.sh << 'EOF'
#!/bin/bash
# TRADEAI Monitoring Script

echo "=== TRADEAI System Status ==="
echo "Timestamp: $(date)"
echo ""

echo "=== Container Status ==="
docker ps --filter "name=tradeai" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "=== Resource Usage ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""

echo "=== Service Health ==="
echo -n "Backend API: "
if curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
    echo "✓ Healthy"
else
    echo "✗ Unhealthy"
fi

echo -n "Frontend: "
if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✓ Healthy"
else
    echo "✗ Unhealthy"
fi

echo -n "MongoDB: "
if docker exec tradeai_mongodb_live mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    echo "✓ Healthy"
else
    echo "✗ Unhealthy"
fi

echo -n "Redis: "
if docker exec tradeai_redis_live redis-cli ping >/dev/null 2>&1; then
    echo "✓ Healthy"
else
    echo "✗ Unhealthy"
fi

echo ""
echo "=== Recent Logs ==="
echo "Backend logs (last 5 lines):"
docker logs --tail 5 tradeai_backend_live 2>/dev/null | head -5
EOF
    
    chmod +x monitor-tradeai.sh
    print_success "Monitoring script created: ./monitor-tradeai.sh"
    
    # Create log rotation script
    cat > rotate-logs.sh << 'EOF'
#!/bin/bash
# TRADEAI Log Rotation Script

echo "Rotating TRADEAI logs..."
docker-compose -f docker-compose.live.yml logs --no-color > "logs/tradeai-$(date +%Y%m%d).log"
docker-compose -f docker-compose.live.yml logs --no-color --tail 0 -f > /dev/null &
echo "Logs rotated to logs/tradeai-$(date +%Y%m%d).log"
EOF
    
    chmod +x rotate-logs.sh
    print_success "Log rotation script created: ./rotate-logs.sh"
}

# Display deployment summary
show_deployment_summary() {
    print_header "Deployment Summary"
    
    # Get server IP
    SERVER_IP=$(curl -s http://checkip.amazonaws.com/ 2>/dev/null || echo "localhost")
    
    echo -e "${GREEN}🎉 TRADEAI Go-Live Deployment Completed Successfully! 🎉${NC}"
    echo ""
    echo -e "${CYAN}=== Access Information ===${NC}"
    echo -e "${WHITE}Frontend URL:${NC}     http://$SERVER_IP:3000"
    echo -e "${WHITE}Backend API:${NC}      http://$SERVER_IP:5000/api"
    echo -e "${WHITE}Health Check:${NC}     http://$SERVER_IP:5000/api/health"
    echo ""
    echo -e "${CYAN}=== Login Credentials ===${NC}"
    echo -e "${WHITE}Email:${NC}            admin@tradeai.com"
    echo -e "${WHITE}Password:${NC}         admin123"
    echo ""
    echo -e "${CYAN}=== Management Commands ===${NC}"
    echo -e "${WHITE}Monitor Status:${NC}   ./monitor-tradeai.sh"
    echo -e "${WHITE}View Logs:${NC}        docker-compose -f $COMPOSE_FILE logs -f"
    echo -e "${WHITE}Restart Services:${NC} docker-compose -f $COMPOSE_FILE restart"
    echo -e "${WHITE}Stop Services:${NC}    docker-compose -f $COMPOSE_FILE down"
    echo ""
    echo -e "${CYAN}=== Service Status ===${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo -e "${CYAN}=== Backup Location ===${NC}"
    echo -e "${WHITE}Backup Directory:${NC} $BACKUP_DIR"
    echo -e "${WHITE}Deployment Log:${NC}   $LOG_FILE"
    echo ""
    echo -e "${GREEN}✅ Premium Corporate UI is now live and ready for FMCG enterprises!${NC}"
    echo -e "${YELLOW}🏢 Perfect for: P&G, Unilever, Nestlé, Coca-Cola, PepsiCo${NC}"
}

# Cleanup on exit
cleanup_on_exit() {
    if [ $? -ne 0 ]; then
        print_error "Deployment failed. Check logs: $LOG_FILE"
        print_status "Running cleanup..."
        docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    fi
}

# Main deployment function
main() {
    # Set trap for cleanup on exit
    trap cleanup_on_exit EXIT
    
    print_banner
    
    # Start deployment log
    log "Starting TRADEAI Go-Live Deployment"
    
    # Pre-deployment checks
    check_root
    check_requirements
    
    # Cleanup and preparation
    cleanup_previous
    create_backup
    update_codebase
    setup_environment
    
    # Deployment
    deploy_services
    wait_for_services
    seed_database
    
    # Post-deployment
    run_health_checks
    setup_monitoring
    
    # Success
    show_deployment_summary
    log "TRADEAI Go-Live Deployment completed successfully"
    
    # Remove trap
    trap - EXIT
}

# Script options
case "${1:-}" in
    --help|-h)
        echo "TRADEAI Go-Live Deployment Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --cleanup      Only run cleanup (no deployment)"
        echo "  --monitor      Show current system status"
        echo ""
        echo "This script will:"
        echo "  1. Check system requirements"
        echo "  2. Clean up any previous deployments"
        echo "  3. Create backups of existing data"
        echo "  4. Deploy TRADEAI with premium corporate UI"
        echo "  5. Run health checks and verification"
        echo "  6. Set up monitoring and logging"
        echo ""
        exit 0
        ;;
    --cleanup)
        print_header "Cleanup Mode"
        cleanup_previous
        print_success "Cleanup completed"
        exit 0
        ;;
    --monitor)
        if [ -f "monitor-tradeai.sh" ]; then
            ./monitor-tradeai.sh
        else
            print_error "Monitoring script not found. Run deployment first."
        fi
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac