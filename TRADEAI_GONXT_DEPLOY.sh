#!/bin/bash

# 🚀 TRADEAI Production Deployment for tradeai.gonxt.tech
# Fixes the npm install issue by properly handling backend/frontend structure
# Domain: tradeai.gonxt.tech
# Author: OpenHands AI Assistant
# Version: GONXT-1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration - TRADEAI.GONXT.TECH
DOMAIN="tradeai.gonxt.tech"
EMAIL="reshigan@gonxt.tech"
APP_DIR="/var/www/tradeai"
NGINX_CONFIG="/etc/nginx/sites-available/tradeai"
NGINX_ENABLED="/etc/nginx/sites-enabled/tradeai"
SSL_DIR="/etc/letsencrypt/live/$DOMAIN"
BACKUP_DIR="/var/backups/tradeai-$(date +%Y%m%d-%H%M%S)"

# Service ports
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

step() {
    echo -e "${PURPLE}[STEP] $1${NC}"
}

# Display domain configuration
display_domain_info() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}🌐 TRADEAI DEPLOYMENT CONFIGURATION${NC}"
    echo -e "${PURPLE}================================${NC}"
    echo -e "${BLUE}Domain: ${YELLOW}$DOMAIN${NC}"
    echo -e "${BLUE}Email: ${YELLOW}$EMAIL${NC}"
    echo -e "${BLUE}App Directory: ${YELLOW}$APP_DIR${NC}"
    echo -e "${BLUE}Backend Port: ${YELLOW}$BACKEND_PORT${NC}"
    echo -e "${BLUE}Frontend Port: ${YELLOW}$FRONTEND_PORT${NC}"
    echo -e "${PURPLE}================================${NC}"
    echo ""
    
    read -p "⚠️  Make sure DNS for $DOMAIN points to this server. Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Deployment cancelled. Please configure DNS first."
        exit 1
    fi
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Create backup
create_backup() {
    log "Creating backup of existing installation..."
    
    if [ -d "$APP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        cp -r "$APP_DIR" "$BACKUP_DIR/app" 2>/dev/null || true
        cp "$NGINX_CONFIG" "$BACKUP_DIR/nginx-config" 2>/dev/null || true
        log "Backup created at: $BACKUP_DIR"
    else
        info "No existing installation found, skipping backup"
    fi
}

# Complete system cleanup
cleanup_system() {
    step "Complete System Cleanup"
    
    # Stop all services
    log "Stopping all services..."
    systemctl stop nginx 2>/dev/null || true
    systemctl stop apache2 2>/dev/null || true
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Kill processes safely
    log "Stopping existing processes..."
    pkill -f "tradeai" 2>/dev/null || true
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "react-scripts" 2>/dev/null || true
    
    # Remove old application
    if [ -d "$APP_DIR" ]; then
        warning "Removing old application directory: $APP_DIR"
        rm -rf "$APP_DIR"
    fi
    
    # Remove nginx configs
    rm -f "$NGINX_ENABLED" "$NGINX_CONFIG"
    
    log "System cleanup completed"
}

# Install system dependencies
install_system_dependencies() {
    step "Installing System Dependencies"
    
    # Update package lists
    log "Updating package lists..."
    apt-get update
    
    # Install essential packages
    log "Installing essential packages..."
    apt-get install -y nginx git curl wget unzip certbot python3-certbot-nginx ufw build-essential
    
    log "System dependencies installed successfully"
}

# Install Node.js
install_nodejs() {
    step "Installing Node.js from NodeSource..."
    
    # Install pre-requisites
    log "Installing pre-requisites"
    apt-get update
    apt-get install -y apt-transport-https ca-certificates curl gnupg
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    log "Repository configured successfully."
    log "To install Node.js, run: apt-get install nodejs -y"
    log "You can use N|solid Runtime as a node.js alternative"
    log "To install N|solid Runtime, run: apt-get install nsolid -y "
    
    # Install Node.js
    apt-get install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Verify installation
    log "Node.js version: $(node --version)"
    log "npm version: $(npm --version)"
}

# Setup application directory and clone repository
setup_application() {
    step "Setting up TRADEAI application..."
    
    # Create application directory
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # Clone repository
    log "Cloning TRADEAI repository..."
    git clone https://github.com/Reshigan/TRADEAI.git .
    
    # Verify repository structure
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        error "Invalid repository structure - missing backend or frontend directories"
        exit 1
    fi
    
    if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
        error "Missing package.json files in backend or frontend directories"
        exit 1
    fi
    
    log "Repository cloned and verified successfully"
}

# Install application dependencies - CORRECTED VERSION
install_application_dependencies() {
    step "Installing Application Dependencies (CORRECTED FOR BACKEND/FRONTEND STRUCTURE)"
    
    # Install backend dependencies
    log "Installing backend dependencies..."
    cd "$APP_DIR/backend"
    npm install --production --no-optional
    
    # Verify backend structure
    if [ ! -f "src/server.js" ]; then
        error "Backend server file not found at backend/src/server.js"
        exit 1
    fi
    
    # Install frontend dependencies
    log "Installing frontend dependencies..."
    cd "$APP_DIR/frontend"
    npm install
    
    # Build frontend for production
    log "Building frontend for production..."
    npm run build
    
    # Verify frontend build
    if [ ! -d "build" ]; then
        error "Frontend build failed - build directory not found"
        exit 1
    fi
    
    # Set proper permissions
    cd "$APP_DIR"
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    log "Dependencies installed successfully"
}

# Configure firewall
configure_firewall() {
    step "Configuring firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow essential services
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow $BACKEND_PORT/tcp
    ufw allow $FRONTEND_PORT/tcp
    
    # Enable firewall
    ufw --force enable
    
    log "Firewall configured successfully"
}

# Setup backend service
setup_backend() {
    step "Setting Up Backend Service"
    
    cd "$APP_DIR/backend"
    
    # Create backend PM2 config
    log "Creating backend PM2 configuration..."
    cat > ecosystem.backend.js << EOF
module.exports = {
  apps: [{
    name: 'tradeai-backend',
    script: 'src/server.js',
    cwd: '$APP_DIR/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: $BACKEND_PORT
    },
    error_file: '/var/log/pm2/tradeai-backend-error.log',
    out_file: '/var/log/pm2/tradeai-backend-out.log',
    log_file: '/var/log/pm2/tradeai-backend.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
};
EOF
    
    log "Backend setup completed"
}

# Setup frontend service
setup_frontend() {
    step "Setting Up Frontend Service"
    
    cd "$APP_DIR/frontend"
    
    # Create frontend PM2 config for serving built files
    log "Creating frontend PM2 configuration..."
    cat > ecosystem.frontend.js << EOF
module.exports = {
  apps: [{
    name: 'tradeai-frontend',
    script: 'npx',
    args: 'serve -s build -l $FRONTEND_PORT',
    cwd: '$APP_DIR/frontend',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: $FRONTEND_PORT
    },
    error_file: '/var/log/pm2/tradeai-frontend-error.log',
    out_file: '/var/log/pm2/tradeai-frontend-out.log',
    log_file: '/var/log/pm2/tradeai-frontend.log',
    time: true,
    max_memory_restart: '512M',
    restart_delay: 4000
  }]
};
EOF
    
    # Install serve globally if not present
    npm install -g serve
    
    log "Frontend setup completed"
}

# Configure Nginx for tradeai.gonxt.tech
configure_nginx() {
    step "Configuring Nginx for $DOMAIN"
    
    # Create Nginx configuration
    log "Creating Nginx configuration for $DOMAIN..."
    cat > "$NGINX_CONFIG" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration for $DOMAIN
    ssl_certificate $SSL_DIR/fullchain.pem;
    ssl_certificate_key $SSL_DIR/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Frontend (React app)
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files
    location /static/ {
        alias $APP_DIR/frontend/build/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
EOF
    
    # Enable site
    ln -sf "$NGINX_CONFIG" "$NGINX_ENABLED"
    
    # Test Nginx configuration
    nginx -t
    
    log "Nginx configuration completed for $DOMAIN"
}

# Setup SSL certificate for tradeai.gonxt.tech
setup_ssl() {
    step "Setting Up SSL Certificate for $DOMAIN"
    
    # Stop nginx temporarily
    systemctl stop nginx
    
    # Obtain SSL certificate
    log "Obtaining SSL certificate for $DOMAIN..."
    certbot certonly --standalone -d "$DOMAIN" -d "www.$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
    
    # Start nginx
    systemctl start nginx
    
    # Setup auto-renewal
    log "Setting up SSL certificate auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    log "SSL certificate setup completed for $DOMAIN"
}

# Start services
start_services() {
    step "Starting Services"
    
    # Create PM2 log directory
    mkdir -p /var/log/pm2
    chown -R www-data:www-data /var/log/pm2
    
    # Start backend
    log "Starting backend service..."
    cd "$APP_DIR/backend"
    pm2 start ecosystem.backend.js
    
    # Start frontend
    log "Starting frontend service..."
    cd "$APP_DIR/frontend"
    pm2 start ecosystem.frontend.js
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    # Start and enable nginx
    systemctl enable nginx
    systemctl start nginx
    
    log "All services started successfully"
}

# Verify deployment
verify_deployment() {
    step "Verifying Deployment for $DOMAIN"
    
    # Check services
    log "Checking service status..."
    
    # Check PM2 processes
    pm2 status
    
    # Check nginx
    systemctl status nginx --no-pager
    
    # Check ports
    log "Checking port availability..."
    netstat -tlnp | grep -E ":($BACKEND_PORT|$FRONTEND_PORT|80|443)"
    
    # Test endpoints
    log "Testing endpoints..."
    curl -I http://localhost:$BACKEND_PORT/api/health 2>/dev/null || warning "Backend health check failed"
    curl -I http://localhost:$FRONTEND_PORT 2>/dev/null || warning "Frontend check failed"
    
    log "Deployment verification completed"
}

# Main deployment function
main() {
    log "🚀 Starting TRADEAI Production Deployment for $DOMAIN"
    
    display_domain_info
    check_root
    create_backup
    cleanup_system
    install_system_dependencies
    install_nodejs
    configure_firewall
    setup_application
    install_application_dependencies  # This is corrected to handle backend/frontend structure
    setup_backend
    setup_frontend
    configure_nginx
    setup_ssl
    start_services
    verify_deployment
    
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}🎉 TRADEAI DEPLOYMENT COMPLETED!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo -e "${BLUE}🌐 Your application is available at: ${YELLOW}https://$DOMAIN${NC}"
    echo -e "${BLUE}📊 Backend API: ${YELLOW}https://$DOMAIN/api/${NC}"
    echo -e "${BLUE}🖥️  Frontend: ${YELLOW}https://$DOMAIN${NC}"
    echo -e "${BLUE}📝 Logs: ${YELLOW}pm2 logs${NC}"
    echo -e "${BLUE}🔧 Management: ${YELLOW}pm2 status, pm2 restart all, pm2 stop all${NC}"
    echo -e "${GREEN}================================${NC}"
}

# Run main function
main "$@"