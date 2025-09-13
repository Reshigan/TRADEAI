#!/bin/bash

# TRADEAI Live Production Deployment Script
# Premium Corporate UI for FMCG Enterprises
# One-command deployment for live environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.live.yml"
ENV_FILE=".env.production"
PROJECT_NAME="tradeai"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_header "Checking System Requirements"
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed: $(docker --version)"
    
    # Check Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if command_exists docker-compose; then
        print_success "Docker Compose is installed: $(docker-compose --version)"
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        print_success "Docker Compose (plugin) is installed: $(docker compose version)"
        DOCKER_COMPOSE_CMD="docker compose"
    fi
    
    # Check available disk space (minimum 2GB)
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 2097152 ]; then
        print_warning "Low disk space detected. At least 2GB recommended."
    else
        print_success "Sufficient disk space available"
    fi
    
    # Check available memory (minimum 1GB)
    available_memory=$(free -m | awk 'NR==2{print $7}')
    if [ "$available_memory" -lt 1024 ]; then
        print_warning "Low memory detected. At least 1GB recommended."
    else
        print_success "Sufficient memory available"
    fi
}

# Function to setup environment
setup_environment() {
    print_header "Setting Up Environment"
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file $ENV_FILE not found!"
        exit 1
    fi
    print_success "Environment file found: $ENV_FILE"
    
    # Create necessary directories
    print_status "Creating necessary directories..."
    mkdir -p logs uploads backups ssl
    
    # Set proper permissions
    chmod 755 logs uploads backups
    
    print_success "Environment setup completed"
}

# Function to stop existing containers
stop_existing() {
    print_header "Stopping Existing Containers"
    
    # Stop any existing containers
    if [ -f "$COMPOSE_FILE" ]; then
        print_status "Stopping existing containers..."
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
        print_success "Existing containers stopped"
    fi
    
    # Clean up unused containers and networks
    print_status "Cleaning up unused resources..."
    docker system prune -f >/dev/null 2>&1 || true
    print_success "Cleanup completed"
}

# Function to build and start services
start_services() {
    print_header "Building and Starting Services"
    
    print_status "Building Docker images..."
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" build --no-cache
    
    print_status "Starting services..."
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d
    
    print_success "Services started successfully"
}

# Function to wait for services to be healthy
wait_for_services() {
    print_header "Waiting for Services to be Ready"
    
    print_status "Waiting for MongoDB to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker exec tradeai_mongodb_live mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            print_success "MongoDB is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "MongoDB failed to start within 60 seconds"
        exit 1
    fi
    
    print_status "Waiting for Backend API to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
            print_success "Backend API is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Backend API failed to start within 60 seconds"
        exit 1
    fi
    
    print_status "Waiting for Frontend to be ready..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            print_success "Frontend is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Frontend failed to start within 30 seconds"
        exit 1
    fi
}

# Function to seed database
seed_database() {
    print_header "Seeding Database"
    
    print_status "Running database seeding..."
    if docker exec tradeai_backend_live npm run seed:production; then
        print_success "Database seeded successfully"
    else
        print_warning "Database seeding failed, but continuing..."
    fi
}

# Function to show deployment status
show_status() {
    print_header "Deployment Status"
    
    echo -e "${CYAN}Container Status:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep tradeai || true
    
    echo ""
    echo -e "${CYAN}Service Health:${NC}"
    
    # Check MongoDB
    if docker exec tradeai_mongodb_live mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        echo -e "MongoDB: ${GREEN}✓ Healthy${NC}"
    else
        echo -e "MongoDB: ${RED}✗ Unhealthy${NC}"
    fi
    
    # Check Backend
    if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
        echo -e "Backend API: ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Backend API: ${RED}✗ Unhealthy${NC}"
    fi
    
    # Check Frontend
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo -e "Frontend: ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Frontend: ${RED}✗ Unhealthy${NC}"
    fi
}

# Function to show access information
show_access_info() {
    print_header "Access Information"
    
    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
    
    echo -e "${CYAN}🌐 Application URLs:${NC}"
    echo -e "   Frontend (Premium Corporate UI): ${GREEN}http://$SERVER_IP:3000${NC}"
    echo -e "   Backend API:                     ${GREEN}http://$SERVER_IP:5000/api${NC}"
    echo -e "   Health Check:                    ${GREEN}http://$SERVER_IP:5000/api/health${NC}"
    echo ""
    echo -e "${CYAN}🔐 Default Login Credentials:${NC}"
    echo -e "   Email:    ${GREEN}admin@tradeai.com${NC}"
    echo -e "   Password: ${GREEN}admin123${NC}"
    echo ""
    echo -e "${CYAN}🎨 Premium Features:${NC}"
    echo -e "   ✓ Glass Morphism Design System"
    echo -e "   ✓ Corporate Blue & Gold Color Palette"
    echo -e "   ✓ Professional Inter Typography"
    echo -e "   ✓ Sophisticated Hexagonal Logo"
    echo -e "   ✓ Enterprise-Grade Interface"
    echo -e "   ✓ Perfect for FMCG Companies (P&G, Unilever, Nestlé)"
    echo ""
    echo -e "${CYAN}📊 Management Commands:${NC}"
    echo -e "   View logs:    ${YELLOW}docker-compose -f $COMPOSE_FILE logs -f${NC}"
    echo -e "   Stop all:     ${YELLOW}docker-compose -f $COMPOSE_FILE down${NC}"
    echo -e "   Restart:      ${YELLOW}docker-compose -f $COMPOSE_FILE restart${NC}"
    echo -e "   Status:       ${YELLOW}docker-compose -f $COMPOSE_FILE ps${NC}"
}

# Function to create management script
create_management_script() {
    print_status "Creating management script..."
    
    cat > manage-tradeai.sh << 'EOF'
#!/bin/bash

# TRADEAI Management Script
COMPOSE_FILE="docker-compose.live.yml"

case "$1" in
    start)
        echo "Starting TRADEAI services..."
        docker-compose -f $COMPOSE_FILE up -d
        ;;
    stop)
        echo "Stopping TRADEAI services..."
        docker-compose -f $COMPOSE_FILE down
        ;;
    restart)
        echo "Restarting TRADEAI services..."
        docker-compose -f $COMPOSE_FILE restart
        ;;
    status)
        echo "TRADEAI service status:"
        docker-compose -f $COMPOSE_FILE ps
        ;;
    logs)
        echo "TRADEAI service logs:"
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    backup)
        echo "Creating database backup..."
        docker exec tradeai_mongodb_live mongodump --out /data/backup/$(date +%Y%m%d_%H%M%S)
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|backup}"
        exit 1
        ;;
esac
EOF
    
    chmod +x manage-tradeai.sh
    print_success "Management script created: manage-tradeai.sh"
}

# Main deployment function
main() {
    print_header "TRADEAI Live Production Deployment"
    echo -e "${CYAN}Premium Corporate UI for FMCG Enterprises${NC}"
    echo -e "${CYAN}Glass Morphism Design • Enterprise Ready${NC}"
    echo ""
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root. Consider using a non-root user for better security."
    fi
    
    # Run deployment steps
    check_requirements
    setup_environment
    stop_existing
    start_services
    wait_for_services
    seed_database
    create_management_script
    
    # Show final status
    echo ""
    show_status
    echo ""
    show_access_info
    
    print_header "Deployment Complete!"
    print_success "TRADEAI is now running with premium corporate UI!"
    print_success "Perfect for multinational FMCG companies like P&G, Unilever, and Nestlé"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "1. Access the application at ${GREEN}http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip'):3000${NC}"
    echo -e "2. Login with admin@tradeai.com / admin123"
    echo -e "3. Explore the premium glass morphism interface"
    echo -e "4. Use ${GREEN}./manage-tradeai.sh${NC} for ongoing management"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"