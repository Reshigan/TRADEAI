#!/bin/bash

# TRADEAI AWS Deployment Script
# This script deploys TRADEAI on AWS EC2 instance
# Server: 13.247.139.75
# Domain: tradeai.gonxt.tech

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="tradeai.gonxt.tech"
SERVER_IP="13.247.139.75"
PROJECT_DIR="/opt/tradeai"
BACKUP_DIR="/opt/tradeai-backup"

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

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to check system requirements
check_system() {
    print_status "Checking system requirements..."
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        print_error "Cannot determine OS version"
        exit 1
    fi
    
    . /etc/os-release
    if [[ "$ID" != "ubuntu" ]] && [[ "$ID" != "debian" ]]; then
        print_warning "This script is optimized for Ubuntu/Debian. Proceeding anyway..."
    fi
    
    # Check available disk space (minimum 10GB)
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 10485760 ]]; then
        print_error "Insufficient disk space. At least 10GB required."
        exit 1
    fi
    
    print_success "System requirements check passed"
}

# Function to install Docker and Docker Compose
install_docker() {
    print_status "Installing Docker and Docker Compose..."
    
    # Remove old Docker installations
    apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Update package index
    apt-get update
    
    # Install prerequisites
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        software-properties-common \
        git \
        wget \
        unzip
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    apt-get update
    
    # Install Docker
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group (if not root)
    if [[ $SUDO_USER ]]; then
        usermod -aG docker $SUDO_USER
        print_status "Added $SUDO_USER to docker group. Please log out and back in for changes to take effect."
    fi
    
    print_success "Docker and Docker Compose installed successfully"
}

# Function to setup firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    # Install ufw if not present
    apt-get install -y ufw
    
    # Reset firewall rules
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow specific ports for development/debugging (optional)
    # ufw allow 3000/tcp  # Frontend dev
    # ufw allow 5000/tcp  # Backend dev
    # ufw allow 8000/tcp  # AI services
    # ufw allow 8080/tcp  # Monitoring
    
    # Enable firewall
    ufw --force enable
    
    print_success "Firewall configured successfully"
}

# Function to create project directory and backup existing installation
setup_directories() {
    print_status "Setting up project directories..."
    
    # Create backup if existing installation found
    if [[ -d "$PROJECT_DIR" ]]; then
        print_warning "Existing installation found. Creating backup..."
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        mv "$PROJECT_DIR" "${BACKUP_DIR}_${TIMESTAMP}"
        print_success "Backup created at ${BACKUP_DIR}_${TIMESTAMP}"
    fi
    
    # Create project directory
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    print_success "Project directories created"
}

# Function to clone repository
clone_repository() {
    print_status "Cloning TRADEAI repository..."
    
    cd "$PROJECT_DIR"
    
    # Clone the repository
    git clone https://github.com/Reshigan/TRADEAI.git .
    
    # Set proper permissions
    chown -R $SUDO_USER:$SUDO_USER "$PROJECT_DIR" 2>/dev/null || true
    
    print_success "Repository cloned successfully"
}

# Function to setup environment configuration
setup_environment() {
    print_status "Setting up environment configuration..."
    
    cd "$PROJECT_DIR"
    
    # Copy environment template
    if [[ ! -f .env ]]; then
        cp .env.example .env
        print_status "Environment file created from template"
    else
        print_warning "Environment file already exists. Skipping..."
    fi
    
    # Update environment file with server-specific values
    sed -i "s/DOMAIN=.*/DOMAIN=$DOMAIN/" .env
    sed -i "s/SERVER_IP=.*/SERVER_IP=$SERVER_IP/" .env
    
    print_success "Environment configuration completed"
}

# Function to build and start services
deploy_services() {
    print_status "Building and deploying services..."
    
    cd "$PROJECT_DIR"
    
    # Use simple nginx config for initial deployment
    if [[ -f nginx-simple.conf ]]; then
        cp nginx-simple.conf nginx.conf
        print_status "Using simple nginx configuration (no SSL)"
    fi
    
    # Pull latest images and build
    docker compose pull 2>/dev/null || docker-compose pull
    docker compose build --no-cache 2>/dev/null || docker-compose build --no-cache
    
    # Start services
    docker compose up -d 2>/dev/null || docker-compose up -d
    
    print_success "Services deployed successfully"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for services to start
    sleep 30
    
    # Check service health
    max_attempts=30
    attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f http://localhost/health >/dev/null 2>&1; then
            print_success "Services are ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        print_status "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 10
    done
    
    print_warning "Services may not be fully ready. Check logs with: docker compose logs"
}

# Function to setup SSL (optional)
setup_ssl() {
    print_status "SSL setup is optional. To enable SSL later:"
    echo "1. Obtain SSL certificates for $DOMAIN"
    echo "2. Place certificates in ./ssl/ directory"
    echo "3. Update nginx.conf to use SSL configuration"
    echo "4. Restart nginx: docker compose restart nginx"
}

# Function to display deployment information
show_deployment_info() {
    print_success "TRADEAI deployment completed successfully!"
    echo ""
    echo "==================================================="
    echo "DEPLOYMENT INFORMATION"
    echo "==================================================="
    echo "Domain: http://$DOMAIN"
    echo "IP Address: http://$SERVER_IP"
    echo "Project Directory: $PROJECT_DIR"
    echo ""
    echo "Services:"
    echo "- Frontend: http://$DOMAIN"
    echo "- Backend API: http://$DOMAIN/api"
    echo "- AI Services: http://$DOMAIN/ai"
    echo "- Monitoring: http://$DOMAIN/monitoring"
    echo ""
    echo "Default Login Credentials:"
    echo "- Admin: admin@tradeai.com / password123"
    echo "- Manager: manager@tradeai.com / password123"
    echo "- KAM: kam@tradeai.com / password123"
    echo ""
    echo "Management Commands:"
    echo "- View logs: docker compose logs -f"
    echo "- Restart services: docker compose restart"
    echo "- Stop services: docker compose down"
    echo "- Update deployment: git pull && docker compose up -d --build"
    echo ""
    echo "Configuration Files:"
    echo "- Environment: $PROJECT_DIR/.env"
    echo "- Nginx: $PROJECT_DIR/nginx.conf"
    echo "- Docker Compose: $PROJECT_DIR/docker-compose.yml"
    echo "==================================================="
}

# Function to setup monitoring and maintenance
setup_maintenance() {
    print_status "Setting up maintenance tasks..."
    
    # Create maintenance script
    cat > /usr/local/bin/tradeai-maintenance << 'EOF'
#!/bin/bash
# TRADEAI Maintenance Script

PROJECT_DIR="/opt/tradeai"
LOG_FILE="/var/log/tradeai-maintenance.log"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Cleanup old Docker images and containers
cleanup_docker() {
    log_message "Starting Docker cleanup"
    docker system prune -f
    docker image prune -f
    log_message "Docker cleanup completed"
}

# Backup database
backup_database() {
    log_message "Starting database backup"
    cd "$PROJECT_DIR"
    docker compose exec -T mongodb mongodump --out /tmp/backup
    docker compose cp mongodb:/tmp/backup ./backups/$(date +%Y%m%d_%H%M%S)
    log_message "Database backup completed"
}

# Update application
update_application() {
    log_message "Starting application update"
    cd "$PROJECT_DIR"
    git pull
    docker compose up -d --build
    log_message "Application update completed"
}

case "$1" in
    cleanup)
        cleanup_docker
        ;;
    backup)
        backup_database
        ;;
    update)
        update_application
        ;;
    *)
        echo "Usage: $0 {cleanup|backup|update}"
        exit 1
        ;;
esac
EOF
    
    chmod +x /usr/local/bin/tradeai-maintenance
    
    # Create backup directory
    mkdir -p "$PROJECT_DIR/backups"
    
    # Setup cron jobs for maintenance
    (crontab -l 2>/dev/null; echo "0 2 * * 0 /usr/local/bin/tradeai-maintenance cleanup") | crontab -
    (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/tradeai-maintenance backup") | crontab -
    
    print_success "Maintenance tasks configured"
}

# Main deployment function
main() {
    print_status "Starting TRADEAI AWS deployment..."
    print_status "Target: $DOMAIN ($SERVER_IP)"
    echo ""
    
    check_root
    check_system
    install_docker
    setup_firewall
    setup_directories
    clone_repository
    setup_environment
    deploy_services
    wait_for_services
    setup_maintenance
    setup_ssl
    show_deployment_info
    
    print_success "Deployment completed successfully!"
    print_status "You can now access TRADEAI at: http://$DOMAIN"
}

# Run main function
main "$@"