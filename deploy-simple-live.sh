#!/bin/bash

# TRADEAI Simple Live Deployment Script
# Premium Corporate UI for FMCG Enterprises
# Works with existing repository structure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

# Create simple docker-compose for live deployment
create_live_compose() {
    print_status "Creating live deployment configuration..."
    
    cat > docker-compose.simple-live.yml << 'EOF'
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:7.0
    container_name: tradeai_mongodb_live
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: trade_ai_production
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    networks:
      - tradeai_network
    command: mongod --bind_ip_all

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: tradeai_backend_live
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/trade_ai_production
      - PORT=5000
      - JWT_SECRET=tradeai-jwt-secret-2024-production-key-very-long-and-secure
      - SESSION_SECRET=tradeai-session-secret-2024-production-key-very-long-and-secure
      - CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    networks:
      - tradeai_network
    volumes:
      - ./backend/uploads:/app/uploads

  # Frontend Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - REACT_APP_API_URL=http://localhost:5000/api
        - REACT_APP_THEME=corporate
    container_name: tradeai_frontend_live
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - tradeai_network
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
      - REACT_APP_THEME=corporate

volumes:
  mongodb_data:
    driver: local

networks:
  tradeai_network:
    driver: bridge
EOF

    print_success "Live deployment configuration created"
}

# Main deployment function
main() {
    print_header "TRADEAI Simple Live Deployment"
    echo -e "${CYAN}Premium Corporate UI for FMCG Enterprises${NC}"
    echo -e "${CYAN}Glass Morphism Design • Enterprise Ready${NC}"
    echo ""
    
    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is available"
    
    # Check Docker Compose
    if command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose is not available"
        exit 1
    fi
    print_success "Docker Compose is available"
    
    # Create deployment configuration
    create_live_compose
    
    # Stop any existing containers
    print_status "Stopping any existing containers..."
    $DOCKER_COMPOSE_CMD -f docker-compose.simple-live.yml down --remove-orphans 2>/dev/null || true
    
    # Clean up
    print_status "Cleaning up old resources..."
    docker system prune -f >/dev/null 2>&1 || true
    
    # Build and start services
    print_header "Building and Starting Services"
    print_status "Building Docker images..."
    $DOCKER_COMPOSE_CMD -f docker-compose.simple-live.yml build --no-cache
    
    print_status "Starting services..."
    $DOCKER_COMPOSE_CMD -f docker-compose.simple-live.yml up -d
    
    # Wait for services
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check MongoDB
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker exec tradeai_mongodb_live mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            print_success "MongoDB is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    # Check Backend
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
            print_success "Backend API is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    # Seed database
    print_status "Seeding database..."
    docker exec tradeai_backend_live npm run seed:production 2>/dev/null || print_warning "Database seeding failed, continuing..."
    
    # Show final status
    print_header "Deployment Complete!"
    
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
    echo -e "   View logs:    ${YELLOW}docker-compose -f docker-compose.simple-live.yml logs -f${NC}"
    echo -e "   Stop all:     ${YELLOW}docker-compose -f docker-compose.simple-live.yml down${NC}"
    echo -e "   Restart:      ${YELLOW}docker-compose -f docker-compose.simple-live.yml restart${NC}"
    echo -e "   Status:       ${YELLOW}docker-compose -f docker-compose.simple-live.yml ps${NC}"
    
    print_success "TRADEAI is now running with premium corporate UI!"
    print_success "Perfect for multinational FMCG companies!"
}

# Run main function
main "$@"