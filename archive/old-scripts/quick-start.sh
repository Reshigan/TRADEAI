#!/bin/bash

# TRADEAI Quick Start Script
# For local development and testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are available"
}

# Setup environment
setup_env() {
    print_status "Setting up environment..."
    
    if [[ ! -f .env ]]; then
        cp .env.example .env
        print_status "Created .env file from template"
    else
        print_warning ".env file already exists"
    fi
    
    # Update for local development
    sed -i 's/DOMAIN=.*/DOMAIN=localhost/' .env 2>/dev/null || true
    sed -i 's/SERVER_IP=.*/SERVER_IP=127.0.0.1/' .env 2>/dev/null || true
    
    print_success "Environment configured for local development"
}

# Start services
start_services() {
    print_status "Starting TRADEAI services..."
    
    # Use simple nginx config
    if [[ -f nginx-simple.conf ]]; then
        cp nginx-simple.conf nginx.conf
        print_status "Using simple nginx configuration"
    fi
    
    # Build and start services
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d --build
    else
        docker compose up -d --build
    fi
    
    print_success "Services started successfully"
}

# Wait for services
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for services to start
    sleep 30
    
    # Check if services are responding
    max_attempts=20
    attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f http://localhost/health >/dev/null 2>&1; then
            print_success "All services are ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        print_status "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 10
    done
    
    print_warning "Services may not be fully ready. Check logs with: docker compose logs"
}

# Show information
show_info() {
    print_success "TRADEAI is now running locally!"
    echo ""
    echo "==================================================="
    echo "LOCAL DEVELOPMENT INFORMATION"
    echo "==================================================="
    echo "Frontend: http://localhost"
    echo "Backend API: http://localhost/api"
    echo "AI Services: http://localhost/ai"
    echo "Monitoring: http://localhost/monitoring"
    echo ""
    echo "Default Login Credentials:"
    echo "- Admin: admin@tradeai.com / password123"
    echo "- Manager: manager@tradeai.com / password123"
    echo "- KAM: kam@tradeai.com / password123"
    echo ""
    echo "Useful Commands:"
    echo "- View logs: docker compose logs -f"
    echo "- Stop services: docker compose down"
    echo "- Restart: docker compose restart"
    echo "==================================================="
}

# Main function
main() {
    echo "🚀 TRADEAI Quick Start"
    echo "======================"
    echo ""
    
    check_docker
    setup_env
    start_services
    wait_for_services
    show_info
    
    print_success "Setup completed! Access TRADEAI at http://localhost"
}

# Handle script arguments
case "${1:-}" in
    "stop")
        print_status "Stopping TRADEAI services..."
        if command -v docker-compose &> /dev/null; then
            docker-compose down
        else
            docker compose down
        fi
        print_success "Services stopped"
        ;;
    "restart")
        print_status "Restarting TRADEAI services..."
        if command -v docker-compose &> /dev/null; then
            docker-compose restart
        else
            docker compose restart
        fi
        print_success "Services restarted"
        ;;
    "logs")
        if command -v docker-compose &> /dev/null; then
            docker-compose logs -f
        else
            docker compose logs -f
        fi
        ;;
    "status")
        if command -v docker-compose &> /dev/null; then
            docker-compose ps
        else
            docker compose ps
        fi
        ;;
    *)
        main
        ;;
esac