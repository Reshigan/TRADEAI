#!/bin/bash

# 🚀 TRADEAI HOME Production Deployment Script
# Complete multi-service deployment for TRADEAI platform in home directory
# Handles: Backend (Node.js), Frontend (React), SSL, Nginx
# Domain: reshigan@gonxt.tech
# Author: OpenHands AI Assistant
# Version: HOME-1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
DOMAIN="reshigan.gonxt.tech"
EMAIL="reshigan@gonxt.tech"
APP_DIR="$HOME/tradeai"
NGINX_CONFIG="/etc/nginx/sites-available/tradeai"
NGINX_ENABLED="/etc/nginx/sites-enabled/tradeai"
SSL_DIR="/etc/letsencrypt/live/$DOMAIN"
BACKUP_DIR="$HOME/backups/tradeai-$(date +%Y%m%d-%H%M%S)"

# Service ports
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Get current user
CURRENT_USER=$(whoami)
if [ "$CURRENT_USER" = "root" ]; then
    # If running as root, use the actual user who called sudo
    CURRENT_USER=${SUDO_USER:-ubuntu}
    APP_DIR="/home/$CURRENT_USER/tradeai"
    BACKUP_DIR="/home/$CURRENT_USER/backups/tradeai-$(date +%Y%m%d-%H%M%S)"
fi

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
        sudo -u $CURRENT_USER mkdir -p "$BACKUP_DIR"
        sudo -u $CURRENT_USER cp -r "$APP_DIR" "$BACKUP_DIR/app" 2>/dev/null || true
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
    
    # Stop PM2 processes for the user
    sudo -u $CURRENT_USER pm2 stop all 2>/dev/null || true
    sudo -u $CURRENT_USER pm2 delete all 2>/dev/null || true
    sudo -u $CURRENT_USER pm2 kill 2>/dev/null || true
    
    # Kill processes
    pkill -f nginx 2>/dev/null || true
    pkill -f apache 2>/dev/null || true
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "react-scripts" 2>/dev/null || true
    
    # Remove old application
    if [ -d "$APP_DIR" ]; then
        warning "Removing old application directory: $APP_DIR"
        rm -rf "$APP_DIR"
    fi
    
    # Remove nginx configs
    rm -f "$NGINX_ENABLED" "$NGINX_CONFIG"
    
    # Fix broken packages
    log "Fixing broken packages..."
    dpkg --configure -a 2>/dev/null || true
    apt-get -f install -y 2>/dev/null || true
    
    log "System cleanup completed"
}

# Install system dependencies
install_dependencies() {
    step "Installing System Dependencies"
    
    # Update system
    log "Updating system packages..."
    apt-get update
    
    # Install basic packages
    log "Installing essential packages..."
    apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        build-essential \
        nginx \
        certbot \
        python3-certbot-nginx \
        ufw \
        net-tools
    
    # Install Node.js 20.x from NodeSource
    log "Installing Node.js 20.x from NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Verify installations
    node_version=$(node --version 2>/dev/null || echo "FAILED")
    npm_version=$(npm --version 2>/dev/null || echo "FAILED")
    
    if [[ "$node_version" == "FAILED" ]] || [[ "$npm_version" == "FAILED" ]]; then
        error "Node.js installation failed"
        exit 1
    fi
    
    log "✅ Node.js: $node_version"
    log "✅ npm: $npm_version"
    
    # Install PM2 globally
    log "Installing PM2..."
    npm install -g pm2
    
    # Verify PM2
    pm2_version=$(pm2 --version 2>/dev/null || echo "FAILED")
    if [[ "$pm2_version" == "FAILED" ]]; then
        error "PM2 installation failed"
        exit 1
    fi
    
    log "✅ PM2: $pm2_version"
    
    # Ensure www-data user exists
    if ! id "www-data" &>/dev/null; then
        log "Creating www-data user..."
        useradd --system --gid www-data --no-create-home --home /var/www --shell /usr/sbin/nologin www-data
    fi
    
    log "Dependencies installed successfully"
}

# Configure firewall
configure_firewall() {
    step "Configuring Firewall"
    
    # Reset and configure UFW
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow essential ports
    ufw allow ssh
    ufw allow 22
    ufw allow 80
    ufw allow 443
    ufw allow $BACKEND_PORT
    ufw allow $FRONTEND_PORT
    
    # Enable firewall
    ufw --force enable
    
    log "Firewall configured successfully"
}

# Clone and setup application
setup_application() {
    step "Setting Up TRADEAI Application in Home Directory"
    
    # Create application directory as user
    log "Creating application directory: $APP_DIR"
    sudo -u $CURRENT_USER mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # Clone repository as user
    log "Cloning TRADEAI repository..."
    sudo -u $CURRENT_USER git clone https://github.com/Reshigan/TRADEAI.git .
    
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

# Setup backend service
setup_backend() {
    step "Setting Up Backend Service"
    
    cd "$APP_DIR/backend"
    
    # Install backend dependencies as user
    log "Installing backend dependencies..."
    sudo -u $CURRENT_USER npm install --production --no-optional
    
    # Verify server file exists
    if [ ! -f "src/server.js" ]; then
        error "Backend server file not found at backend/src/server.js"
        exit 1
    fi
    
    # Create backend PM2 config as user
    log "Creating backend PM2 configuration..."
    sudo -u $CURRENT_USER cat > ecosystem.backend.js << EOF
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
    error_file: '$APP_DIR/logs/tradeai-backend-error.log',
    out_file: '$APP_DIR/logs/tradeai-backend-out.log',
    log_file: '$APP_DIR/logs/tradeai-backend.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};
EOF
    
    # Create logs directory
    sudo -u $CURRENT_USER mkdir -p "$APP_DIR/logs"
    
    log "Backend setup completed"
}

# Setup frontend service
setup_frontend() {
    step "Setting Up Frontend Service"
    
    cd "$APP_DIR/frontend"
    
    # Install frontend dependencies as user
    log "Installing frontend dependencies..."
    sudo -u $CURRENT_USER npm install
    
    # Build frontend for production as user
    log "Building frontend for production..."
    sudo -u $CURRENT_USER npm run build
    
    # Verify build directory exists
    if [ ! -d "build" ]; then
        error "Frontend build failed - build directory not found"
        exit 1
    fi
    
    # Create simple static server for frontend as user
    log "Creating frontend server..."
    sudo -u $CURRENT_USER cat > server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${port}`);
});
EOF
    
    # Create frontend PM2 config as user
    log "Creating frontend PM2 configuration..."
    sudo -u $CURRENT_USER cat > ecosystem.frontend.js << EOF
module.exports = {
  apps: [{
    name: 'tradeai-frontend',
    script: 'server.js',
    cwd: '$APP_DIR/frontend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: $FRONTEND_PORT
    },
    error_file: '$APP_DIR/logs/tradeai-frontend-error.log',
    out_file: '$APP_DIR/logs/tradeai-frontend-out.log',
    log_file: '$APP_DIR/logs/tradeai-frontend.log',
    time: true,
    max_memory_restart: '512M',
    watch: false
  }]
};
EOF
    
    log "Frontend setup completed"
}

# Create nginx configuration
create_nginx_config() {
    step "Creating Nginx Configuration"
    
    # Create nginx config for multi-service setup
    cat > "$NGINX_CONFIG" << EOF
# TRADEAI Multi-Service Nginx Configuration
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    # API routes to backend
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
    
    # Socket.IO for real-time features
    location /socket.io/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Frontend application (React)
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
        
        # Handle React Router
        try_files \$uri \$uri/ @fallback;
    }
    
    # Fallback for React Router
    location @fallback {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # Remove default nginx site
    rm -f /etc/nginx/sites-enabled/default
    
    # Enable the site
    ln -sf "$NGINX_CONFIG" "$NGINX_ENABLED"
    
    # Test nginx configuration
    if nginx -t; then
        log "✅ Nginx configuration is valid"
    else
        error "❌ Nginx configuration is invalid"
        exit 1
    fi
    
    log "Nginx configuration created successfully"
}

# Setup SSL certificate
setup_ssl() {
    step "Setting Up SSL Certificate"
    
    # Start nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Wait for nginx to start
    sleep 3
    
    # Check domain resolution
    log "Checking domain resolution..."
    domain_ip=$(dig +short $DOMAIN 2>/dev/null || echo "")
    server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "")
    
    if [ -z "$domain_ip" ]; then
        warning "Domain $DOMAIN does not resolve"
        warning "Continuing with HTTP only..."
        return 1
    fi
    
    if [ "$domain_ip" != "$server_ip" ]; then
        warning "Domain resolves to $domain_ip but server IP is $server_ip"
        warning "SSL may fail, continuing anyway..."
    fi
    
    # Request SSL certificate
    log "Requesting SSL certificate..."
    if certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domains "$DOMAIN,www.$DOMAIN" \
        --redirect; then
        
        log "✅ SSL certificate obtained successfully"
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        log "✅ SSL auto-renewal configured"
        return 0
    else
        warning "⚠️ SSL certificate setup failed"
        warning "Continuing with HTTP only"
        return 1
    fi
}

# Start all services
start_services() {
    step "Starting All Services"
    
    # Ensure proper ownership
    chown -R $CURRENT_USER:$CURRENT_USER "$APP_DIR"
    
    # Start backend service as user
    log "Starting backend service..."
    cd "$APP_DIR/backend"
    sudo -u $CURRENT_USER pm2 start ecosystem.backend.js
    
    # Wait for backend to start
    sleep 5
    
    # Check if backend started
    backend_status=$(sudo -u $CURRENT_USER pm2 list | grep "tradeai-backend" || echo "")
    if [ -z "$backend_status" ]; then
        error "Backend failed to start, checking logs..."
        sudo -u $CURRENT_USER pm2 logs tradeai-backend --lines 20 || true
        error "Backend startup failed"
        exit 1
    fi
    
    # Start frontend service as user
    log "Starting frontend service..."
    cd "$APP_DIR/frontend"
    sudo -u $CURRENT_USER pm2 start ecosystem.frontend.js
    
    # Wait for frontend to start
    sleep 5
    
    # Check if frontend started
    frontend_status=$(sudo -u $CURRENT_USER pm2 list | grep "tradeai-frontend" || echo "")
    if [ -z "$frontend_status" ]; then
        error "Frontend failed to start, checking logs..."
        sudo -u $CURRENT_USER pm2 logs tradeai-frontend --lines 20 || true
        error "Frontend startup failed"
        exit 1
    fi
    
    # Save PM2 configuration
    sudo -u $CURRENT_USER pm2 save
    
    # Setup PM2 startup for the user
    log "Setting up PM2 startup..."
    pm2 startup systemd -u $CURRENT_USER --hp "/home/$CURRENT_USER"
    
    # Restart nginx
    systemctl restart nginx
    
    log "All services started successfully"
}

# Verify deployment
verify_deployment() {
    step "Verifying Deployment"
    
    # Check nginx
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx is running"
    else
        error "❌ Nginx is not running"
        return 1
    fi
    
    # Check PM2 processes
    backend_status=$(sudo -u $CURRENT_USER pm2 list | grep "tradeai-backend" | grep "online" || echo "")
    frontend_status=$(sudo -u $CURRENT_USER pm2 list | grep "tradeai-frontend" | grep "online" || echo "")
    
    if [ -n "$backend_status" ]; then
        log "✅ Backend service is running"
    else
        error "❌ Backend service is not running"
        sudo -u $CURRENT_USER pm2 list
        return 1
    fi
    
    if [ -n "$frontend_status" ]; then
        log "✅ Frontend service is running"
    else
        error "❌ Frontend service is not running"
        sudo -u $CURRENT_USER pm2 list
        return 1
    fi
    
    # Check ports
    if netstat -tlnp | grep -q ":$BACKEND_PORT"; then
        log "✅ Backend listening on port $BACKEND_PORT"
    else
        warning "⚠️ Backend not listening on port $BACKEND_PORT"
    fi
    
    if netstat -tlnp | grep -q ":$FRONTEND_PORT"; then
        log "✅ Frontend listening on port $FRONTEND_PORT"
    else
        warning "⚠️ Frontend not listening on port $FRONTEND_PORT"
    fi
    
    # Test HTTP responses
    log "Testing service responses..."
    
    # Test frontend
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$FRONTEND_PORT | grep -q "200"; then
        log "✅ Frontend responds to HTTP requests"
    else
        warning "⚠️ Frontend may not be responding correctly"
    fi
    
    # Test backend (if it has a health endpoint)
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$BACKEND_PORT/api/health 2>/dev/null | grep -q "200"; then
        log "✅ Backend API responds to requests"
    else
        info "ℹ️ Backend API health check not available (this may be normal)"
    fi
    
    # Check SSL
    if [ -d "$SSL_DIR" ]; then
        log "✅ SSL certificate is installed"
    else
        info "ℹ️ No SSL certificate (HTTP only)"
    fi
    
    log "Deployment verification completed"
}

# Show final information
show_final_info() {
    echo ""
    echo "🎉 TRADEAI HOME PRODUCTION DEPLOYMENT COMPLETED!"
    echo "================================================="
    echo ""
    echo "🌐 Your TRADEAI platform is now available at:"
    if [ -d "$SSL_DIR" ]; then
        echo "   🔒 https://$DOMAIN"
        echo "   🔒 https://www.$DOMAIN"
    else
        echo "   🌍 http://$DOMAIN"
        echo "   🌍 http://www.$DOMAIN"
    fi
    echo ""
    echo "🏗️ Architecture:"
    echo "   📱 Frontend (React): Port $FRONTEND_PORT"
    echo "   🔧 Backend (Node.js): Port $BACKEND_PORT"
    echo "   🌐 Nginx Proxy: Ports 80/443"
    echo ""
    echo "📊 Service Status:"
    echo "   • Nginx: $(systemctl is-active nginx)"
    echo "   • Backend: $(sudo -u $CURRENT_USER pm2 list | grep -c "tradeai-backend.*online") processes"
    echo "   • Frontend: $(sudo -u $CURRENT_USER pm2 list | grep -c "tradeai-frontend.*online") processes"
    echo ""
    echo "📁 Important Paths:"
    echo "   • Application: $APP_DIR"
    echo "   • Backend: $APP_DIR/backend"
    echo "   • Frontend: $APP_DIR/frontend"
    echo "   • Logs: $APP_DIR/logs/"
    echo "   • Nginx Config: $NGINX_CONFIG"
    echo "   • Backup: $BACKUP_DIR"
    echo ""
    echo "🔧 Management Commands (run as $CURRENT_USER):"
    echo "   • View all logs: pm2 logs"
    echo "   • View backend logs: pm2 logs tradeai-backend"
    echo "   • View frontend logs: pm2 logs tradeai-frontend"
    echo "   • Restart backend: pm2 restart tradeai-backend"
    echo "   • Restart frontend: pm2 restart tradeai-frontend"
    echo "   • Check status: pm2 status"
    echo "   • Save PM2 config: pm2 save"
    echo ""
    echo "🔧 System Management Commands (run as root):"
    echo "   • Restart nginx: sudo systemctl restart nginx"
    echo "   • Check nginx status: sudo systemctl status nginx"
    echo ""
    if [ ! -d "$SSL_DIR" ]; then
        echo "⚠️ SSL Setup:"
        echo "   SSL certificate setup failed or was skipped."
        echo "   To setup SSL manually:"
        echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
        echo ""
    fi
    echo "✅ TRADEAI Production Platform is Ready!"
    echo "🏠 Installed in home directory: $APP_DIR"
    echo "👤 Running as user: $CURRENT_USER"
    echo "🚀 Multi-service deployment completed successfully!"
}

# Main execution
main() {
    log "🚀 Starting TRADEAI HOME Production Deployment"
    log "Domain: $DOMAIN"
    log "Email: $EMAIL"
    log "User: $CURRENT_USER"
    log "Install Directory: $APP_DIR"
    log "Architecture: Multi-service (Backend + Frontend + Nginx)"
    echo ""
    
    check_root
    create_backup
    cleanup_system
    install_dependencies
    configure_firewall
    setup_application
    setup_backend
    setup_frontend
    create_nginx_config
    setup_ssl || true
    start_services
    verify_deployment
    show_final_info
    
    log "🎉 TRADEAI HOME Production Deployment Completed Successfully!"
}

# Run main function
main "$@"