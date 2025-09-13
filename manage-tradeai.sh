#!/bin/bash

# TRADEAI Management Script
# Premium Corporate UI Management for FMCG Enterprises

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.live.yml"
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

# Function to check if services are running
check_services() {
    local mongodb_running=$(docker ps --filter "name=tradeai_mongodb_live" --filter "status=running" -q)
    local backend_running=$(docker ps --filter "name=tradeai_backend_live" --filter "status=running" -q)
    local frontend_running=$(docker ps --filter "name=tradeai_frontend_live" --filter "status=running" -q)
    
    if [ -n "$mongodb_running" ] && [ -n "$backend_running" ] && [ -n "$frontend_running" ]; then
        return 0
    else
        return 1
    fi
}

# Function to show service status
show_status() {
    print_header "TRADEAI Service Status"
    
    echo -e "${CYAN}Container Status:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep tradeai || echo "No TRADEAI containers running"
    
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
    
    echo ""
    echo -e "${CYAN}Quick Access:${NC}"
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
    echo -e "Frontend: ${GREEN}http://$SERVER_IP:3000${NC}"
    echo -e "Backend:  ${GREEN}http://$SERVER_IP:5000/api${NC}"
}

# Function to start services
start_services() {
    print_header "Starting TRADEAI Services"
    
    if check_services; then
        print_warning "Services are already running"
        show_status
        return 0
    fi
    
    print_status "Starting services..."
    if docker-compose -f $COMPOSE_FILE up -d; then
        print_success "Services started successfully"
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 10
        
        # Check if services are healthy
        timeout=60
        while [ $timeout -gt 0 ]; do
            if check_services; then
                print_success "All services are running"
                show_status
                return 0
            fi
            sleep 2
            timeout=$((timeout - 2))
        done
        
        print_warning "Services started but may not be fully ready yet"
        show_status
    else
        print_error "Failed to start services"
        return 1
    fi
}

# Function to stop services
stop_services() {
    print_header "Stopping TRADEAI Services"
    
    if ! check_services; then
        print_warning "Services are not running"
        return 0
    fi
    
    print_status "Stopping services..."
    if docker-compose -f $COMPOSE_FILE down; then
        print_success "Services stopped successfully"
    else
        print_error "Failed to stop services"
        return 1
    fi
}

# Function to restart services
restart_services() {
    print_header "Restarting TRADEAI Services"
    
    print_status "Restarting services..."
    if docker-compose -f $COMPOSE_FILE restart; then
        print_success "Services restarted successfully"
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 15
        show_status
    else
        print_error "Failed to restart services"
        return 1
    fi
}

# Function to show logs
show_logs() {
    print_header "TRADEAI Service Logs"
    
    if [ -n "$2" ]; then
        # Show logs for specific service
        case "$2" in
            mongodb|mongo|db)
                print_status "Showing MongoDB logs..."
                docker-compose -f $COMPOSE_FILE logs -f mongodb
                ;;
            backend|api)
                print_status "Showing Backend logs..."
                docker-compose -f $COMPOSE_FILE logs -f backend
                ;;
            frontend|ui)
                print_status "Showing Frontend logs..."
                docker-compose -f $COMPOSE_FILE logs -f frontend
                ;;
            nginx|proxy)
                print_status "Showing Nginx logs..."
                docker-compose -f $COMPOSE_FILE logs -f nginx
                ;;
            *)
                print_error "Unknown service: $2"
                echo "Available services: mongodb, backend, frontend, nginx"
                return 1
                ;;
        esac
    else
        # Show all logs
        print_status "Showing all service logs (Press Ctrl+C to exit)..."
        docker-compose -f $COMPOSE_FILE logs -f
    fi
}

# Function to create backup
create_backup() {
    print_header "Creating Database Backup"
    
    if ! docker exec tradeai_mongodb_live mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        print_error "MongoDB is not running or not accessible"
        return 1
    fi
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    print_status "Creating backup in: $backup_dir"
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    # Create MongoDB dump
    if docker exec tradeai_mongodb_live mongodump --db trade_ai_production --out /tmp/backup; then
        # Copy backup from container
        docker cp tradeai_mongodb_live:/tmp/backup/trade_ai_production "$backup_dir/"
        
        # Create backup info file
        cat > "$backup_dir/backup_info.txt" << EOF
TRADEAI Database Backup
Created: $(date)
Database: trade_ai_production
Server: $(hostname)
Version: $(docker exec tradeai_backend_live node -e "console.log(require('./package.json').version)" 2>/dev/null || echo "unknown")
EOF
        
        # Compress backup
        tar -czf "$backup_dir.tar.gz" -C backups "$(basename $backup_dir)"
        rm -rf "$backup_dir"
        
        print_success "Backup created: $backup_dir.tar.gz"
        
        # Show backup size
        local backup_size=$(du -h "$backup_dir.tar.gz" | cut -f1)
        print_status "Backup size: $backup_size"
    else
        print_error "Failed to create database backup"
        return 1
    fi
}

# Function to restore backup
restore_backup() {
    print_header "Restoring Database Backup"
    
    if [ -z "$2" ]; then
        print_error "Please specify backup file to restore"
        echo "Usage: $0 restore <backup_file.tar.gz>"
        return 1
    fi
    
    local backup_file="$2"
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        return 1
    fi
    
    print_warning "This will replace all existing data. Are you sure? (y/N)"
    read -r confirmation
    if [ "$confirmation" != "y" ] && [ "$confirmation" != "Y" ]; then
        print_status "Restore cancelled"
        return 0
    fi
    
    # Extract backup
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Find the backup directory
    local backup_dir=$(find "$temp_dir" -name "trade_ai_production" -type d | head -1)
    if [ -z "$backup_dir" ]; then
        print_error "Invalid backup file format"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Copy backup to container
    docker cp "$backup_dir" tradeai_mongodb_live:/tmp/restore/
    
    # Restore database
    if docker exec tradeai_mongodb_live mongorestore --db trade_ai_production --drop /tmp/restore/trade_ai_production; then
        print_success "Database restored successfully"
    else
        print_error "Failed to restore database"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    docker exec tradeai_mongodb_live rm -rf /tmp/restore
}

# Function to update services
update_services() {
    print_header "Updating TRADEAI Services"
    
    print_status "Pulling latest images..."
    docker-compose -f $COMPOSE_FILE pull
    
    print_status "Rebuilding services..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    print_status "Restarting services with new images..."
    docker-compose -f $COMPOSE_FILE up -d
    
    print_status "Cleaning up old images..."
    docker image prune -f
    
    print_success "Services updated successfully"
    show_status
}

# Function to show help
show_help() {
    echo -e "${CYAN}TRADEAI Management Script${NC}"
    echo -e "${CYAN}Premium Corporate UI for FMCG Enterprises${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC} $0 <command> [options]"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo -e "  ${GREEN}start${NC}           Start all TRADEAI services"
    echo -e "  ${GREEN}stop${NC}            Stop all TRADEAI services"
    echo -e "  ${GREEN}restart${NC}         Restart all TRADEAI services"
    echo -e "  ${GREEN}status${NC}          Show service status and health"
    echo -e "  ${GREEN}logs${NC} [service]  Show service logs (all or specific service)"
    echo -e "  ${GREEN}backup${NC}          Create database backup"
    echo -e "  ${GREEN}restore${NC} <file>  Restore database from backup"
    echo -e "  ${GREEN}update${NC}          Update services to latest version"
    echo -e "  ${GREEN}help${NC}            Show this help message"
    echo ""
    echo -e "${YELLOW}Log Services:${NC}"
    echo -e "  mongodb, backend, frontend, nginx"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0 start"
    echo -e "  $0 logs backend"
    echo -e "  $0 backup"
    echo -e "  $0 restore backups/20240115_143022.tar.gz"
    echo ""
    echo -e "${YELLOW}Quick Access:${NC}"
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
    echo -e "  Frontend: ${GREEN}http://$SERVER_IP:3000${NC}"
    echo -e "  Backend:  ${GREEN}http://$SERVER_IP:5000/api${NC}"
}

# Main script logic
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    backup)
        create_backup
        ;;
    restore)
        restore_backup "$@"
        ;;
    update)
        update_services
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac