#!/bin/bash

# TRADEAI AWS Deployment Script - ARM64/AMD64 Compatible
# Automated deployment for AWS EC2 instances
# Supports Ubuntu 20.04+, Amazon Linux 2, and ARM64/AMD64 architectures

set -e

# Configuration
PROJECT_NAME="TRADEAI"
REPO_URL="https://github.com/Reshigan/TRADEAI.git"
INSTALL_DIR="/opt/tradeai"
LOG_FILE="/var/log/tradeai-deploy.log"
DOMAIN="${DOMAIN:-tradeai.gonxt.tech}"
SERVER_IP="${SERVER_IP:-13.247.139.75}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${PURPLE}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Detect system architecture and OS
detect_system() {
    ARCH=$(uname -m)
    OS=$(lsb_release -si 2>/dev/null || echo "Unknown")
    OS_VERSION=$(lsb_release -sr 2>/dev/null || echo "Unknown")
    
    case $ARCH in
        x86_64)
            PLATFORM="linux/amd64"
            COMPOSE_FILE="docker-compose.yml"
            ;;
        aarch64|arm64)
            PLATFORM="linux/arm64"
            COMPOSE_FILE="docker-compose-arm64.yml"
            warn "Detected ARM64 architecture - using ARM64-optimized configuration"
            ;;
        *)
            error "Unsupported architecture: $ARCH"
            ;;
    esac
    
    info "System: $OS $OS_VERSION"
    info "Architecture: $ARCH"
    info "Platform: $PLATFORM"
    info "Compose file: $COMPOSE_FILE"
}

# Install system dependencies
install_dependencies() {
    header "Installing System Dependencies"
    
    # Update package lists
    info "Updating package lists..."
    apt-get update -y
    
    # Install essential packages
    info "Installing essential packages..."
    apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        htop \
        nano \
        jq
    
    success "System dependencies installed"
}

# Install Docker
install_docker() {
    header "Installing Docker"
    
    if command -v docker &> /dev/null; then
        info "Docker already installed: $(docker --version)"
        return
    fi
    
    # Add Docker's official GPG key
    info "Adding Docker GPG key..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    info "Adding Docker repository..."
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package lists
    apt-get update -y
    
    # Install Docker
    info "Installing Docker..."
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group (if not root)
    if [[ $SUDO_USER ]]; then
        usermod -aG docker $SUDO_USER
        info "Added $SUDO_USER to docker group"
    fi
    
    success "Docker installed: $(docker --version)"
}

# Configure firewall
configure_firewall() {
    header "Configuring Firewall"
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow application ports
    ufw allow 5000/tcp  # Backend API
    ufw allow 8000/tcp  # AI Services
    ufw allow 8080/tcp  # Monitoring
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall configured"
}

# Setup project directory
setup_project() {
    header "Setting Up Project"
    
    # Create backup if directory exists
    if [[ -d "$INSTALL_DIR" ]]; then
        warn "Existing installation found, creating backup..."
        rm -rf "${INSTALL_DIR}.backup" 2>/dev/null || true
        mv "$INSTALL_DIR" "${INSTALL_DIR}.backup"
    fi
    
    # Create project directory
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    # Clone repository
    info "Cloning TRADEAI repository..."
    git clone "$REPO_URL" .
    
    # Set permissions
    chown -R $SUDO_USER:$SUDO_USER "$INSTALL_DIR" 2>/dev/null || true
    
    success "Project setup complete"
}

# Create environment configuration
create_environment() {
    header "Creating Environment Configuration"
    
    cd "$INSTALL_DIR"
    
    # Create .env file
    cat > .env << EOF
# TRADEAI Production Environment Configuration
# Generated on $(date)

# Server Configuration
DOMAIN=$DOMAIN
SERVER_IP=$SERVER_IP
NODE_ENV=production
PLATFORM=$PLATFORM

# Database Configuration
MONGO_USERNAME=admin
MONGO_PASSWORD=TradeAI_Mongo_2024!
MONGO_DATABASE=tradeai
REDIS_PASSWORD=TradeAI_Redis_2024!

# JWT Configuration
JWT_SECRET=TradeAI_JWT_Super_Secret_Key_2024_Change_This_In_Production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=TradeAI_JWT_Refresh_Secret_2024
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
PORT=5000
BACKEND_PORT=5000
AI_SERVICES_PORT=8000
MONITORING_PORT=8080
FRONTEND_PORT=80

# CORS Configuration
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info

# React App Configuration
REACT_APP_API_URL=http://$DOMAIN/api/v1
REACT_APP_SOCKET_URL=http://$DOMAIN
REACT_APP_AI_API_URL=http://$DOMAIN:8000
REACT_APP_MONITORING_URL=http://$DOMAIN:8080

# Build Configuration
CACHEBUST=$(date +%s)
EOF
    
    success "Environment configuration created"
}

# Deploy application
deploy_application() {
    header "Deploying Application"
    
    cd "$INSTALL_DIR"
    
    # Use appropriate compose file based on architecture
    if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
        if [[ -f "docker-compose-arm64.yml" ]]; then
            info "Using ARM64-optimized compose file"
            cp docker-compose-arm64.yml docker-compose.yml
        else
            warn "ARM64 compose file not found, using default with platform override"
            # Add platform specification to existing compose file
            sed -i '/services:/a\  # Platform override for ARM64' docker-compose.yml
        fi
    fi
    
    # Stop any existing containers
    info "Stopping existing containers..."
    docker compose down -v 2>/dev/null || true
    
    # Clean up old images and volumes
    info "Cleaning up old Docker resources..."
    docker system prune -f
    docker volume prune -f
    
    # Build and start services
    info "Building and starting services..."
    docker compose up -d --build
    
    success "Application deployment initiated"
}

# Wait for services to be healthy
wait_for_services() {
    header "Waiting for Services to Start"
    
    cd "$INSTALL_DIR"
    
    local max_attempts=60
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        info "Health check attempt $attempt/$max_attempts..."
        
        # Check if all services are running
        local running_services=$(docker compose ps --services --filter "status=running" | wc -l)
        local total_services=$(docker compose ps --services | wc -l)
        
        if [[ $running_services -eq $total_services ]] && [[ $total_services -gt 0 ]]; then
            success "All services are running!"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Services failed to start within timeout"
        fi
        
        sleep 10
        ((attempt++))
    done
}

# Verify deployment
verify_deployment() {
    header "Verifying Deployment"
    
    cd "$INSTALL_DIR"
    
    # Check service status
    info "Service status:"
    docker compose ps
    
    # Test endpoints
    info "Testing endpoints..."
    
    # Test frontend
    if curl -f -s http://localhost/health.json > /dev/null 2>&1; then
        success "✓ Frontend is accessible"
    else
        warn "✗ Frontend health check failed"
    fi
    
    # Test backend
    if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
        success "✓ Backend API is accessible"
    else
        warn "✗ Backend API health check failed"
    fi
    
    # Test AI services
    if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
        success "✓ AI Services are accessible"
    else
        warn "✗ AI Services health check failed"
    fi
    
    # Test monitoring
    if curl -f -s http://localhost:8080/health > /dev/null 2>&1; then
        success "✓ Monitoring is accessible"
    else
        warn "✗ Monitoring health check failed"
    fi
    
    # Test MongoDB
    if docker compose exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" > /dev/null 2>&1; then
        success "✓ MongoDB is accessible"
    else
        warn "✗ MongoDB health check failed"
    fi
    
    # Test Redis
    if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        success "✓ Redis is accessible"
    else
        warn "✗ Redis health check failed"
    fi
}

# Display deployment information
show_deployment_info() {
    header "Deployment Complete!"
    
    echo -e "${GREEN}🎉 TRADEAI has been successfully deployed!${NC}"
    echo ""
    echo -e "${CYAN}📋 Access Information:${NC}"
    echo -e "   🌐 Main Application: ${YELLOW}http://$DOMAIN${NC} or ${YELLOW}http://$SERVER_IP${NC}"
    echo -e "   🔌 API Endpoint:     ${YELLOW}http://$DOMAIN/api/v1${NC}"
    echo -e "   🤖 AI Services:      ${YELLOW}http://$DOMAIN:8000${NC}"
    echo -e "   📊 Monitoring:       ${YELLOW}http://$DOMAIN:8080${NC}"
    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo -e "   📊 View logs:        ${YELLOW}cd $INSTALL_DIR && sudo docker compose logs -f${NC}"
    echo -e "   🔄 Restart services: ${YELLOW}cd $INSTALL_DIR && sudo docker compose restart${NC}"
    echo -e "   ⏹️  Stop services:    ${YELLOW}cd $INSTALL_DIR && sudo docker compose down${NC}"
    echo -e "   🚀 Start services:   ${YELLOW}cd $INSTALL_DIR && sudo docker compose up -d${NC}"
    echo ""
    echo -e "${CYAN}📁 Important Paths:${NC}"
    echo -e "   📂 Project Directory: ${YELLOW}$INSTALL_DIR${NC}"
    echo -e "   📜 Deployment Log:    ${YELLOW}$LOG_FILE${NC}"
    echo -e "   ⚙️  Environment File:  ${YELLOW}$INSTALL_DIR/.env${NC}"
    echo ""
    echo -e "${CYAN}🔐 Default Credentials:${NC}"
    echo -e "   🗄️  MongoDB: ${YELLOW}admin / TradeAI_Mongo_2024!${NC}"
    echo -e "   🔴 Redis:   ${YELLOW}TradeAI_Redis_2024!${NC}"
    echo ""
    echo -e "${RED}⚠️  Security Note: Change default passwords in production!${NC}"
    echo ""
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
}

# Main deployment function
main() {
    header "TRADEAI AWS Deployment - Starting"
    
    # Create log file
    touch "$LOG_FILE"
    
    log "Starting TRADEAI deployment on $(hostname) at $(date)"
    
    # Run deployment steps
    check_root
    detect_system
    install_dependencies
    install_docker
    configure_firewall
    setup_project
    create_environment
    deploy_application
    wait_for_services
    verify_deployment
    show_deployment_info
    
    log "TRADEAI deployment completed successfully"
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"