#!/bin/bash

# TRADEAI Backend Debug Script
# Diagnose backend startup issues

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

# Check container status
check_containers() {
    print_header "Container Status Check"
    
    echo -e "${CYAN}All TRADEAI containers:${NC}"
    docker ps -a --filter "name=tradeai" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo -e "${CYAN}Backend container details:${NC}"
    if docker ps --filter "name=tradeai_backend_live" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q tradeai_backend_live; then
        print_success "Backend container is running"
    else
        print_error "Backend container is not running"
        echo ""
        echo -e "${CYAN}Checking if backend container exists but stopped:${NC}"
        docker ps -a --filter "name=tradeai_backend_live" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    fi
}

# Check backend logs
check_backend_logs() {
    print_header "Backend Container Logs"
    
    if docker ps --filter "name=tradeai_backend_live" -q | grep -q .; then
        print_status "Showing last 50 lines of backend logs..."
        docker logs --tail 50 tradeai_backend_live
    else
        print_error "Backend container not found or not running"
        print_status "Checking if container exists but is stopped..."
        if docker ps -a --filter "name=tradeai_backend_live" -q | grep -q .; then
            print_warning "Backend container exists but is stopped. Showing logs..."
            docker logs --tail 50 tradeai_backend_live
        else
            print_error "Backend container does not exist"
        fi
    fi
}

# Check environment variables
check_environment() {
    print_header "Environment Variables Check"
    
    if docker ps --filter "name=tradeai_backend_live" -q | grep -q .; then
        print_status "Checking backend environment variables..."
        docker exec tradeai_backend_live env | grep -E "(NODE_ENV|MONGODB_URI|PORT|JWT_SECRET)" | sort
    else
        print_error "Cannot check environment - backend container not running"
    fi
}

# Test MongoDB connection
test_mongodb() {
    print_header "MongoDB Connection Test"
    
    if docker ps --filter "name=tradeai_mongodb_live" -q | grep -q .; then
        print_status "Testing MongoDB connection..."
        if docker exec tradeai_mongodb_live mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            print_success "MongoDB is accessible"
            
            print_status "Checking database status..."
            docker exec tradeai_mongodb_live mongosh --eval "
                db.adminCommand('listDatabases').databases.forEach(
                    function(database) {
                        print('Database: ' + database.name + ' (Size: ' + database.sizeOnDisk + ')');
                    }
                );
            "
        else
            print_error "MongoDB is not accessible"
        fi
    else
        print_error "MongoDB container not running"
    fi
}

# Test network connectivity
test_network() {
    print_header "Network Connectivity Test"
    
    if docker ps --filter "name=tradeai_backend_live" -q | grep -q .; then
        print_status "Testing network connectivity from backend to MongoDB..."
        if docker exec tradeai_backend_live ping -c 3 mongodb >/dev/null 2>&1; then
            print_success "Backend can reach MongoDB container"
        else
            print_error "Backend cannot reach MongoDB container"
        fi
        
        print_status "Testing if backend port is listening..."
        if docker exec tradeai_backend_live netstat -tlnp 2>/dev/null | grep -q ":5000"; then
            print_success "Backend is listening on port 5000"
        else
            print_warning "Backend is not listening on port 5000"
        fi
    else
        print_error "Backend container not running - cannot test network"
    fi
}

# Test health endpoint
test_health_endpoint() {
    print_header "Health Endpoint Test"
    
    print_status "Testing health endpoint from host..."
    if curl -f -m 5 http://localhost:5000/api/health 2>/dev/null; then
        print_success "Health endpoint is accessible from host"
    else
        print_error "Health endpoint is not accessible from host"
        
        print_status "Testing if port 5000 is accessible..."
        if nc -z localhost 5000 2>/dev/null; then
            print_warning "Port 5000 is open but health endpoint not responding"
        else
            print_error "Port 5000 is not accessible"
        fi
    fi
    
    if docker ps --filter "name=tradeai_backend_live" -q | grep -q .; then
        print_status "Testing health endpoint from inside container..."
        if docker exec tradeai_backend_live curl -f -m 5 http://localhost:5000/api/health 2>/dev/null; then
            print_success "Health endpoint works inside container"
        else
            print_error "Health endpoint not working inside container"
        fi
    fi
}

# Check Docker Compose status
check_compose_status() {
    print_header "Docker Compose Status"
    
    if [ -f "docker-compose.live.yml" ]; then
        print_status "Checking Docker Compose services..."
        docker-compose -f docker-compose.live.yml ps
        
        echo ""
        print_status "Checking Docker Compose logs for backend..."
        docker-compose -f docker-compose.live.yml logs --tail 20 backend
    else
        print_error "docker-compose.live.yml not found"
    fi
}

# Provide solutions
provide_solutions() {
    print_header "Potential Solutions"
    
    echo -e "${CYAN}Try these solutions in order:${NC}"
    echo ""
    echo -e "${YELLOW}1. Restart Backend Container:${NC}"
    echo "   docker-compose -f docker-compose.live.yml restart backend"
    echo ""
    echo -e "${YELLOW}2. Check Backend Logs for Errors:${NC}"
    echo "   docker logs -f tradeai_backend_live"
    echo ""
    echo -e "${YELLOW}3. Rebuild Backend Container:${NC}"
    echo "   docker-compose -f docker-compose.live.yml build --no-cache backend"
    echo "   docker-compose -f docker-compose.live.yml up -d backend"
    echo ""
    echo -e "${YELLOW}4. Check Environment Variables:${NC}"
    echo "   docker exec tradeai_backend_live env | grep -E '(NODE_ENV|MONGODB_URI|PORT)'"
    echo ""
    echo -e "${YELLOW}5. Manual Backend Start (Debug Mode):${NC}"
    echo "   docker exec -it tradeai_backend_live npm start"
    echo ""
    echo -e "${YELLOW}6. Complete Restart:${NC}"
    echo "   docker-compose -f docker-compose.live.yml down"
    echo "   docker-compose -f docker-compose.live.yml up -d"
    echo ""
    echo -e "${YELLOW}7. Check for Port Conflicts:${NC}"
    echo "   sudo netstat -tulpn | grep :5000"
    echo "   sudo lsof -i :5000"
}

# Main execution
main() {
    print_header "TRADEAI Backend Diagnosis"
    echo -e "${CYAN}Diagnosing backend startup issues...${NC}"
    echo ""
    
    check_containers
    echo ""
    
    check_backend_logs
    echo ""
    
    check_environment
    echo ""
    
    test_mongodb
    echo ""
    
    test_network
    echo ""
    
    test_health_endpoint
    echo ""
    
    check_compose_status
    echo ""
    
    provide_solutions
}

# Run diagnosis
main "$@"