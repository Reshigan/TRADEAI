#!/bin/bash

# TRADEAI AWS Production Deployment Script
# Automated deployment for AWS EC2 instances with SSL, seeding, and complete setup
# Supports Ubuntu 20.04+, Amazon Linux 2, and ARM64/AMD64 architectures
# Features: SSL/TLS, database seeding, comprehensive monitoring, production-ready

set -e

# Configuration
PROJECT_NAME="TRADEAI"
REPO_URL="https://github.com/Reshigan/TRADEAI.git"
INSTALL_DIR="/opt/tradeai"
LOG_FILE="/var/log/tradeai-deploy.log"
DOMAIN="${DOMAIN:-tradeai.gonxt.tech}"
SERVER_IP="${SERVER_IP:-13.247.139.75}"
SSL_EMAIL="${SSL_EMAIL:-reshigan@gonxt.tech}"
ENABLE_SSL="${ENABLE_SSL:-true}"
SEED_DATA="${SEED_DATA:-true}"

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
        jq \
        net-tools
    
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

# Install Certbot for SSL
install_certbot() {
    header "Installing Certbot for SSL"
    
    if command -v certbot &> /dev/null; then
        info "Certbot already installed: $(certbot --version)"
        return
    fi
    
    # Install snapd if not present
    if ! command -v snap &> /dev/null; then
        info "Installing snapd..."
        apt-get install -y snapd
        systemctl enable --now snapd.socket
        sleep 5
    fi
    
    # Install certbot via snap
    info "Installing certbot..."
    snap install core; snap refresh core
    snap install --classic certbot
    
    # Create symlink
    ln -sf /snap/bin/certbot /usr/bin/certbot
    
    success "Certbot installed"
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
    
    # Allow application ports (for direct access if needed)
    ufw allow 3000/tcp  # Frontend (direct)
    ufw allow 5000/tcp  # Backend API (direct)
    ufw allow 5001/tcp  # Backend API (ARM64)
    ufw allow 8000/tcp  # AI Services (direct)
    ufw allow 8001/tcp  # AI Services (ARM64)
    ufw allow 8080/tcp  # Monitoring (direct)
    ufw allow 8081/tcp  # Monitoring (ARM64)
    
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

# Generate SSL certificates
generate_ssl_certificates() {
    header "Generating SSL Certificates"
    
    if [[ "$ENABLE_SSL" != "true" ]]; then
        info "SSL disabled, skipping certificate generation"
        return
    fi
    
    cd "$INSTALL_DIR"
    
    # Create SSL directory
    mkdir -p ssl
    
    # Check if certificates already exist
    if [[ -f "ssl/fullchain.pem" && -f "ssl/privkey.pem" ]]; then
        info "SSL certificates already exist"
        return
    fi
    
    # Stop nginx if running to free port 80
    docker compose -f "$COMPOSE_FILE" stop nginx 2>/dev/null || true
    
    # Generate certificates using certbot
    info "Generating SSL certificate for $DOMAIN..."
    certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$SSL_EMAIL" \
        -d "$DOMAIN" \
        --cert-path ssl/cert.pem \
        --key-path ssl/privkey.pem \
        --fullchain-path ssl/fullchain.pem \
        --chain-path ssl/chain.pem
    
    # Copy certificates to project directory
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/
    cp /etc/letsencrypt/live/$DOMAIN/cert.pem ssl/
    cp /etc/letsencrypt/live/$DOMAIN/chain.pem ssl/
    
    # Set proper permissions
    chmod 644 ssl/fullchain.pem ssl/cert.pem ssl/chain.pem
    chmod 600 ssl/privkey.pem
    
    # Setup auto-renewal
    info "Setting up SSL certificate auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'cd $INSTALL_DIR && docker compose -f $COMPOSE_FILE restart nginx'") | crontab -
    
    success "SSL certificates generated and auto-renewal configured"
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
REACT_APP_API_URL=/api/v1
REACT_APP_SOCKET_URL=
REACT_APP_AI_API_URL=/ai
REACT_APP_MONITORING_URL=/monitoring

# Build Configuration
CACHEBUST=$(date +%s)
EOF
    
    success "Environment configuration created"
}

# Deploy application
deploy_application() {
    header "Deploying Application"
    
    cd "$INSTALL_DIR"
    
    # Use the appropriate compose file based on architecture
    info "Using compose file: $COMPOSE_FILE"
    
    # Stop any existing containers
    info "Stopping existing containers..."
    docker compose -f "$COMPOSE_FILE" down -v 2>/dev/null || true
    
    # Clean up old images and volumes
    info "Cleaning up old Docker resources..."
    docker system prune -f
    docker volume prune -f
    
    # Build and start services
    info "Building and starting services..."
    docker compose -f "$COMPOSE_FILE" up -d --build
    
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
        local running_services=$(docker compose -f "$COMPOSE_FILE" ps --services --filter "status=running" | wc -l)
        local total_services=$(docker compose -f "$COMPOSE_FILE" ps --services | wc -l)
        
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

# Seed database with test data
seed_database() {
    header "Seeding Database with Test Data"
    
    if [[ "$SEED_DATA" != "true" ]]; then
        info "Database seeding disabled, skipping"
        return
    fi
    
    cd "$INSTALL_DIR"
    
    # Wait for MongoDB to be ready
    info "Waiting for MongoDB to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker compose -f "$COMPOSE_FILE" exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" > /dev/null 2>&1; then
            success "MongoDB is ready"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "MongoDB failed to start within timeout"
        fi
        
        sleep 5
        ((attempt++))
    done
    
    # Create seed data script
    cat > seed-data.js << 'EOF'
// TRADEAI Test Company Data Seeding Script

// Switch to the tradeai database
use('tradeai');

// Clear existing data
db.companies.deleteMany({});
db.users.deleteMany({});
db.trades.deleteMany({});
db.portfolios.deleteMany({});

print('Cleared existing data');

// Insert test companies
const companies = [
    {
        _id: ObjectId(),
        name: "TechCorp Solutions",
        symbol: "TECH",
        sector: "Technology",
        industry: "Software",
        marketCap: 15000000000,
        price: 125.50,
        change: 2.35,
        changePercent: 1.91,
        volume: 2500000,
        description: "Leading software solutions provider",
        founded: 2010,
        employees: 5000,
        headquarters: "San Francisco, CA",
        website: "https://techcorp.example.com",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "Green Energy Inc",
        symbol: "GREN",
        sector: "Energy",
        industry: "Renewable Energy",
        marketCap: 8500000000,
        price: 89.25,
        change: -1.75,
        changePercent: -1.92,
        volume: 1800000,
        description: "Renewable energy solutions and infrastructure",
        founded: 2015,
        employees: 3200,
        headquarters: "Austin, TX",
        website: "https://greenenergy.example.com",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "HealthTech Innovations",
        symbol: "HLTH",
        sector: "Healthcare",
        industry: "Medical Technology",
        marketCap: 12000000000,
        price: 210.75,
        change: 5.25,
        changePercent: 2.55,
        volume: 950000,
        description: "Medical technology and healthcare solutions",
        founded: 2008,
        employees: 7500,
        headquarters: "Boston, MA",
        website: "https://healthtech.example.com",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "Financial Services Group",
        symbol: "FING",
        sector: "Financial Services",
        industry: "Banking",
        marketCap: 25000000000,
        price: 67.80,
        change: 0.95,
        changePercent: 1.42,
        volume: 3200000,
        description: "Comprehensive financial services and banking",
        founded: 1995,
        employees: 15000,
        headquarters: "New York, NY",
        website: "https://fingroup.example.com",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "Retail Dynamics",
        symbol: "RETL",
        sector: "Consumer Discretionary",
        industry: "Retail",
        marketCap: 6500000000,
        price: 45.30,
        change: -0.85,
        changePercent: -1.84,
        volume: 2100000,
        description: "Multi-channel retail and e-commerce platform",
        founded: 2005,
        employees: 12000,
        headquarters: "Seattle, WA",
        website: "https://retaildynamics.example.com",
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

const result = db.companies.insertMany(companies);
print(`Inserted ${result.insertedIds.length} companies`);

// Insert test user
const testUser = {
    _id: ObjectId(),
    username: "testuser",
    email: "test@tradeai.com",
    firstName: "Test",
    lastName: "User",
    role: "trader",
    isActive: true,
    balance: 100000.00,
    createdAt: new Date(),
    updatedAt: new Date()
};

const userResult = db.users.insertOne(testUser);
print(`Inserted test user with ID: ${userResult.insertedId}`);

// Insert test portfolio
const testPortfolio = {
    _id: ObjectId(),
    userId: testUser._id,
    name: "Test Portfolio",
    totalValue: 50000.00,
    cashBalance: 25000.00,
    positions: [
        {
            symbol: "TECH",
            companyId: companies[0]._id,
            shares: 100,
            averagePrice: 120.00,
            currentPrice: 125.50,
            totalValue: 12550.00,
            gainLoss: 550.00,
            gainLossPercent: 4.58
        },
        {
            symbol: "HLTH",
            companyId: companies[2]._id,
            shares: 50,
            averagePrice: 200.00,
            currentPrice: 210.75,
            totalValue: 10537.50,
            gainLoss: 537.50,
            gainLossPercent: 5.38
        }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
};

const portfolioResult = db.portfolios.insertOne(testPortfolio);
print(`Inserted test portfolio with ID: ${portfolioResult.insertedId}`);

// Insert sample trades
const sampleTrades = [
    {
        _id: ObjectId(),
        userId: testUser._id,
        portfolioId: testPortfolio._id,
        symbol: "TECH",
        companyId: companies[0]._id,
        type: "BUY",
        quantity: 100,
        price: 120.00,
        totalAmount: 12000.00,
        status: "COMPLETED",
        executedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
        _id: ObjectId(),
        userId: testUser._id,
        portfolioId: testPortfolio._id,
        symbol: "HLTH",
        companyId: companies[2]._id,
        type: "BUY",
        quantity: 50,
        price: 200.00,
        totalAmount: 10000.00,
        status: "COMPLETED",
        executedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
];

const tradesResult = db.trades.insertMany(sampleTrades);
print(`Inserted ${tradesResult.insertedIds.length} sample trades`);

print('Database seeding completed successfully!');
print('Test data summary:');
print(`- Companies: ${companies.length}`);
print(`- Users: 1`);
print(`- Portfolios: 1`);
print(`- Trades: ${sampleTrades.length}`);
EOF
    
    # Execute seed script
    info "Executing database seed script..."
    docker compose -f "$COMPOSE_FILE" exec -T mongodb mongosh --quiet < seed-data.js
    
    # Clean up seed script
    rm -f seed-data.js
    
    success "Database seeded with test data"
}

# Verify deployment
verify_deployment() {
    header "Verifying Deployment"
    
    cd "$INSTALL_DIR"
    
    # Check service status
    info "Service status:"
    docker compose -f "$COMPOSE_FILE" ps
    
    # Test endpoints
    info "Testing endpoints..."
    
    # Test nginx health
    if curl -f -s http://localhost/health > /dev/null 2>&1; then
        success "✓ Nginx reverse proxy is accessible"
    else
        warn "✗ Nginx reverse proxy health check failed"
    fi
    
    # Test frontend (through nginx)
    if curl -f -s http://localhost/ > /dev/null 2>&1; then
        success "✓ Frontend is accessible through nginx"
    else
        warn "✗ Frontend accessibility check failed"
    fi
    
    # Test backend (through nginx)
    if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
        success "✓ Backend API is accessible through nginx"
    else
        warn "✗ Backend API health check failed"
    fi
    
    # Test AI services (through nginx)
    if curl -f -s http://localhost/ai/health > /dev/null 2>&1; then
        success "✓ AI Services are accessible through nginx"
    else
        warn "✗ AI Services health check failed"
    fi
    
    # Test monitoring (through nginx)
    if curl -f -s http://localhost/monitoring/health > /dev/null 2>&1; then
        success "✓ Monitoring is accessible through nginx"
    else
        warn "✗ Monitoring health check failed"
    fi
    
    # Test MongoDB
    if docker compose -f "$COMPOSE_FILE" exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" > /dev/null 2>&1; then
        success "✓ MongoDB is accessible"
    else
        warn "✗ MongoDB health check failed"
    fi
    
    # Test Redis
    if docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
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
    echo -e "   🤖 AI Services:      ${YELLOW}http://$DOMAIN/ai${NC}"
    echo -e "   📊 Monitoring:       ${YELLOW}http://$DOMAIN/monitoring${NC}"
    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo -e "   📊 View logs:        ${YELLOW}cd $INSTALL_DIR && sudo docker compose -f $COMPOSE_FILE logs -f${NC}"
    echo -e "   🔄 Restart services: ${YELLOW}cd $INSTALL_DIR && sudo docker compose -f $COMPOSE_FILE restart${NC}"
    echo -e "   ⏹️  Stop services:    ${YELLOW}cd $INSTALL_DIR && sudo docker compose -f $COMPOSE_FILE down${NC}"
    echo -e "   🚀 Start services:   ${YELLOW}cd $INSTALL_DIR && sudo docker compose -f $COMPOSE_FILE up -d${NC}"
    echo ""
    echo -e "${CYAN}📁 Important Paths:${NC}"
    echo -e "   📂 Project Directory: ${YELLOW}$INSTALL_DIR${NC}"
    echo -e "   📜 Deployment Log:    ${YELLOW}$LOG_FILE${NC}"
    echo -e "   ⚙️  Environment File:  ${YELLOW}$INSTALL_DIR/.env${NC}"
    echo -e "   🐳 Compose File:      ${YELLOW}$INSTALL_DIR/$COMPOSE_FILE${NC}"
    echo ""
    echo -e "${CYAN}🔐 Default Credentials:${NC}"
    echo -e "   🗄️  MongoDB: ${YELLOW}admin / TradeAI_Mongo_2024!${NC}"
    echo -e "   🔴 Redis:   ${YELLOW}TradeAI_Redis_2024!${NC}"
    echo ""
    echo -e "${CYAN}🔍 Troubleshooting:${NC}"
    echo -e "   • Check service logs: ${YELLOW}docker compose -f $COMPOSE_FILE logs [service]${NC}"
    echo -e "   • Check service status: ${YELLOW}docker compose -f $COMPOSE_FILE ps${NC}"
    echo -e "   • Restart specific service: ${YELLOW}docker compose -f $COMPOSE_FILE restart [service]${NC}"
    echo -e "   • Rebuild service: ${YELLOW}docker compose -f $COMPOSE_FILE up -d --build [service]${NC}"
    echo ""
    echo -e "${RED}⚠️  Security Note: Change default passwords in production!${NC}"
    echo ""
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
}

# Main deployment function
main() {
    header "TRADEAI AWS Production Deployment - Starting"
    
    # Create log file
    touch "$LOG_FILE"
    
    log "Starting TRADEAI production deployment on $(hostname) at $(date)"
    log "Features: SSL/TLS, database seeding, comprehensive monitoring"
    
    # Run deployment steps
    check_root
    detect_system
    install_dependencies
    install_docker
    install_certbot
    configure_firewall
    setup_project
    create_environment
    generate_ssl_certificates
    deploy_application
    wait_for_services
    seed_database
    verify_deployment
    show_deployment_info
    
    log "TRADEAI production deployment completed successfully"
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"