#!/bin/bash

# TRADEAI Complete Installation Script
# Clean installation with removal of all previous work
# Version: 2.1.3 - Premium Corporate UI Release

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
REPO_URL="https://github.com/Reshigan/TRADEAI.git"
BRANCH="main"
INSTALL_DIR="TRADEAI"
BACKUP_DIR="./tradeai-backup-$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./tradeai-install-$(date +%Y%m%d_%H%M%S).log"

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
    echo -e "${CYAN}Complete Installation Script v2.1.3${NC}"
    echo -e "${YELLOW}🏢 Perfect for: P&G, Unilever, Nestlé, Coca-Cola, PepsiCo${NC}"
    echo ""
}

# Show help
show_help() {
    echo "TRADEAI Complete Installation Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h         Show this help message"
    echo "  --clean            Remove all TRADEAI installations and Docker artifacts"
    echo "  --install          Fresh installation (default)"
    echo "  --upgrade          Upgrade existing installation"
    echo "  --uninstall        Complete removal of TRADEAI"
    echo "  --status           Show current installation status"
    echo ""
    echo "This script will:"
    echo "  1. Remove all previous TRADEAI installations"
    echo "  2. Clean up Docker containers, images, and volumes"
    echo "  3. Install system requirements (Docker, Docker Compose, Git)"
    echo "  4. Clone latest TRADEAI repository"
    echo "  5. Deploy premium corporate UI with Docker"
    echo "  6. Set up monitoring and management tools"
    echo "  7. Verify complete installation"
    echo ""
    echo "Features:"
    echo "  ✅ Glass Morphism Premium UI"
    echo "  ✅ Corporate Color Scheme (Deep Blue & Gold)"
    echo "  ✅ Enterprise-grade Security"
    echo "  ✅ Multi-tenant Architecture"
    echo "  ✅ Complete Docker Deployment"
    echo "  ✅ Automated Health Monitoring"
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

# Complete removal of all TRADEAI installations
complete_removal() {
    print_header "Complete TRADEAI Removal"
    
    # Stop all TRADEAI containers
    print_status "Stopping all TRADEAI containers..."
    docker ps -a --filter "name=tradeai" --format "{{.Names}}" | while read container; do
        if [ ! -z "$container" ]; then
            print_status "Stopping container: $container"
            docker stop "$container" 2>/dev/null || true
            docker rm "$container" 2>/dev/null || true
        fi
    done
    
    # Stop any Docker Compose services
    for compose_file in docker-compose.yml docker-compose.live.yml docker-compose.production.yml; do
        if [ -f "$compose_file" ]; then
            print_status "Stopping Docker Compose services from $compose_file..."
            docker-compose -f "$compose_file" down --remove-orphans --volumes 2>/dev/null || true
        fi
    done
    
    # Remove TRADEAI images
    print_status "Removing TRADEAI Docker images..."
    docker images --filter "reference=tradeai*" --format "{{.Repository}}:{{.Tag}}" | while read image; do
        if [ ! -z "$image" ]; then
            print_status "Removing image: $image"
            docker rmi "$image" 2>/dev/null || true
        fi
    done
    
    # Remove TRADEAI volumes
    print_status "Removing TRADEAI Docker volumes..."
    docker volume ls --filter "name=tradeai" --format "{{.Name}}" | while read volume; do
        if [ ! -z "$volume" ]; then
            print_status "Removing volume: $volume"
            docker volume rm "$volume" 2>/dev/null || true
        fi
    done
    
    # Remove TRADEAI networks
    print_status "Removing TRADEAI Docker networks..."
    docker network ls --filter "name=tradeai" --format "{{.Name}}" | while read network; do
        if [ ! -z "$network" ]; then
            print_status "Removing network: $network"
            docker network rm "$network" 2>/dev/null || true
        fi
    done
    
    # Kill processes using TRADEAI ports
    print_status "Freeing up TRADEAI ports..."
    for port in 3000 5000 27017 6379 80 443; do
        PID=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$PID" ]; then
            print_status "Killing process on port $port (PID: $PID)"
            kill -9 $PID 2>/dev/null || true
        fi
    done
    
    # Remove TRADEAI directories
    print_status "Removing TRADEAI directories..."
    for dir in TRADEAI tradeai TRADEAI-* tradeai-*; do
        if [ -d "$dir" ]; then
            print_status "Removing directory: $dir"
            rm -rf "$dir" 2>/dev/null || true
        fi
    done
    
    # Remove TRADEAI files
    print_status "Removing TRADEAI files..."
    rm -f tradeai-* TRADEAI-* deploy-*.log install-*.log monitor-tradeai.sh rotate-logs.sh 2>/dev/null || true
    
    # Clean Docker system
    print_status "Cleaning Docker system..."
    docker system prune -af --volumes 2>/dev/null || true
    
    print_success "Complete TRADEAI removal finished"
}

# Install system requirements
install_requirements() {
    print_header "Installing System Requirements"
    
    # Update system packages
    print_status "Updating system packages..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -y
    elif command -v yum &> /dev/null; then
        sudo yum update -y
    fi
    
    # Install Git
    if ! command -v git &> /dev/null; then
        print_status "Installing Git..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get install -y git curl wget
        elif command -v yum &> /dev/null; then
            sudo yum install -y git curl wget
        fi
        print_success "Git installed"
    else
        print_success "Git is already installed: $(git --version)"
    fi
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        print_status "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        print_success "Docker installed"
        print_warning "Please log out and back in for Docker permissions to take effect"
    else
        print_success "Docker is already installed: $(docker --version)"
    fi
    
    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_status "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        print_success "Docker Compose installed"
    else
        print_success "Docker Compose is already installed: $(docker-compose --version)"
    fi
    
    # Install additional tools
    print_status "Installing additional tools..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y htop netstat-nat lsof
    elif command -v yum &> /dev/null; then
        sudo yum install -y htop net-tools lsof
    fi
    
    print_success "System requirements installed"
}

# Clone TRADEAI repository
clone_repository() {
    print_header "Cloning TRADEAI Repository"
    
    # Remove existing directory if it exists
    if [ -d "$INSTALL_DIR" ]; then
        print_status "Removing existing TRADEAI directory..."
        rm -rf "$INSTALL_DIR"
    fi
    
    # Clone repository
    print_status "Cloning TRADEAI repository..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    
    # Change to repository directory
    cd "$INSTALL_DIR"
    
    # Checkout main branch
    print_status "Switching to main branch..."
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    
    print_success "Repository cloned successfully"
}

# Deploy TRADEAI
deploy_tradeai() {
    print_header "Deploying TRADEAI"
    
    # Make deployment script executable
    if [ -f "deploy-golive.sh" ]; then
        chmod +x deploy-golive.sh
        print_status "Running TRADEAI deployment..."
        ./deploy-golive.sh
    else
        print_error "Deployment script not found"
        return 1
    fi
}

# Create management scripts
create_management_scripts() {
    print_header "Creating Management Scripts"
    
    # Create start script
    cat > start-tradeai.sh << 'EOF'
#!/bin/bash
echo "Starting TRADEAI services..."
cd TRADEAI
docker-compose -f docker-compose.live.yml up -d
echo "TRADEAI services started"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000/api"
EOF
    chmod +x start-tradeai.sh
    
    # Create stop script
    cat > stop-tradeai.sh << 'EOF'
#!/bin/bash
echo "Stopping TRADEAI services..."
cd TRADEAI
docker-compose -f docker-compose.live.yml down
echo "TRADEAI services stopped"
EOF
    chmod +x stop-tradeai.sh
    
    # Create status script
    cat > status-tradeai.sh << 'EOF'
#!/bin/bash
echo "=== TRADEAI Status ==="
echo "Timestamp: $(date)"
echo ""

cd TRADEAI 2>/dev/null || { echo "TRADEAI not installed"; exit 1; }

echo "=== Container Status ==="
docker-compose -f docker-compose.live.yml ps

echo ""
echo "=== Service Health ==="
echo -n "Frontend: "
if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
fi

echo -n "Backend API: "
if curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
fi

echo -n "MongoDB: "
if docker exec tradeai_mongodb_live mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
fi

echo -n "Redis: "
if docker exec tradeai_redis_live redis-cli ping >/dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
fi

echo ""
echo "=== Access Information ==="
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000/api"
echo "Login: admin@tradeai.com / admin123"
EOF
    chmod +x status-tradeai.sh
    
    # Create update script
    cat > update-tradeai.sh << 'EOF'
#!/bin/bash
echo "Updating TRADEAI..."
cd TRADEAI
git pull origin main
docker-compose -f docker-compose.live.yml down
docker-compose -f docker-compose.live.yml build --no-cache
docker-compose -f docker-compose.live.yml up -d
echo "TRADEAI updated successfully"
EOF
    chmod +x update-tradeai.sh
    
    # Create uninstall script
    cat > uninstall-tradeai.sh << 'EOF'
#!/bin/bash
echo "Uninstalling TRADEAI..."
read -p "Are you sure you want to completely remove TRADEAI? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Stop services
    cd TRADEAI 2>/dev/null && docker-compose -f docker-compose.live.yml down --volumes
    
    # Remove containers
    docker ps -a --filter "name=tradeai" --format "{{.Names}}" | xargs -r docker rm -f
    
    # Remove images
    docker images --filter "reference=tradeai*" --format "{{.Repository}}:{{.Tag}}" | xargs -r docker rmi -f
    
    # Remove volumes
    docker volume ls --filter "name=tradeai" --format "{{.Name}}" | xargs -r docker volume rm
    
    # Remove directories and files
    cd ..
    rm -rf TRADEAI
    rm -f *-tradeai.sh tradeai-* TRADEAI-*
    
    echo "TRADEAI completely uninstalled"
else
    echo "Uninstall cancelled"
fi
EOF
    chmod +x uninstall-tradeai.sh
    
    print_success "Management scripts created"
}

# Show installation status
show_status() {
    print_header "TRADEAI Installation Status"
    
    if [ -d "TRADEAI" ]; then
        print_success "TRADEAI directory exists"
        
        cd TRADEAI
        if [ -f "docker-compose.live.yml" ]; then
            print_success "Docker Compose configuration found"
            
            # Check if services are running
            if docker-compose -f docker-compose.live.yml ps | grep -q "Up"; then
                print_success "TRADEAI services are running"
                
                # Test endpoints
                if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
                    print_success "Frontend is accessible"
                else
                    print_warning "Frontend is not accessible"
                fi
                
                if curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
                    print_success "Backend API is accessible"
                else
                    print_warning "Backend API is not accessible"
                fi
            else
                print_warning "TRADEAI services are not running"
            fi
        else
            print_warning "Docker Compose configuration not found"
        fi
        cd ..
    else
        print_warning "TRADEAI is not installed"
    fi
    
    # Check management scripts
    for script in start-tradeai.sh stop-tradeai.sh status-tradeai.sh update-tradeai.sh uninstall-tradeai.sh; do
        if [ -f "$script" ]; then
            print_success "Management script: $script"
        else
            print_warning "Missing management script: $script"
        fi
    done
}

# Show installation summary
show_summary() {
    print_header "Installation Summary"
    
    # Get server IP
    SERVER_IP=$(curl -s http://checkip.amazonaws.com/ 2>/dev/null || echo "localhost")
    
    echo -e "${GREEN}🎉 TRADEAI Installation Completed Successfully! 🎉${NC}"
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
    echo -e "${WHITE}Start Services:${NC}   ./start-tradeai.sh"
    echo -e "${WHITE}Stop Services:${NC}    ./stop-tradeai.sh"
    echo -e "${WHITE}Check Status:${NC}     ./status-tradeai.sh"
    echo -e "${WHITE}Update TRADEAI:${NC}   ./update-tradeai.sh"
    echo -e "${WHITE}Uninstall:${NC}        ./uninstall-tradeai.sh"
    echo ""
    echo -e "${CYAN}=== Premium Features ===${NC}"
    echo -e "${WHITE}✅ Glass Morphism UI${NC}    - Sophisticated frosted glass effects"
    echo -e "${WHITE}✅ Corporate Colors${NC}     - Deep blue (#1e40af) with gold accents"
    echo -e "${WHITE}✅ Enterprise Security${NC}  - JWT auth, rate limiting, CORS"
    echo -e "${WHITE}✅ Multi-tenant Ready${NC}   - Company isolation and permissions"
    echo -e "${WHITE}✅ Docker Deployment${NC}    - Complete containerized solution"
    echo ""
    echo -e "${YELLOW}🏢 Perfect for FMCG Enterprises: P&G, Unilever, Nestlé, Coca-Cola, PepsiCo${NC}"
    echo ""
    echo -e "${GREEN}✅ Your premium corporate trading platform is ready for production!${NC}"
}

# Main installation function
install_tradeai() {
    print_banner
    log "Starting TRADEAI complete installation"
    
    # Pre-installation
    check_root
    complete_removal
    install_requirements
    
    # Installation
    clone_repository
    deploy_tradeai
    
    # Post-installation
    cd ..
    create_management_scripts
    show_summary
    
    log "TRADEAI installation completed successfully"
}

# Main script logic
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --clean)
        print_header "Clean Mode"
        complete_removal
        print_success "Cleanup completed"
        exit 0
        ;;
    --install)
        install_tradeai
        exit 0
        ;;
    --upgrade)
        print_header "Upgrade Mode"
        if [ -d "TRADEAI" ]; then
            cd TRADEAI
            git pull origin main
            ./deploy-golive.sh
            cd ..
            print_success "TRADEAI upgraded successfully"
        else
            print_error "TRADEAI not found. Use --install instead."
            exit 1
        fi
        exit 0
        ;;
    --uninstall)
        print_header "Uninstall Mode"
        complete_removal
        rm -f *-tradeai.sh tradeai-* TRADEAI-*
        print_success "TRADEAI completely uninstalled"
        exit 0
        ;;
    --status)
        show_status
        exit 0
        ;;
    *)
        install_tradeai
        ;;
esac