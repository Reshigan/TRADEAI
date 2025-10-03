#!/bin/bash

# 🧹 TRADEAI Complete Cleanup & Home Deployment Script
# Removes ALL old installations from root/opt and deploys fresh in home directory
# Eliminates permission issues by keeping everything in user space
# Domain: reshigan@gonxt.tech
# Author: OpenHands AI Assistant
# Version: CLEAN-HOME-1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
DOMAIN="reshigan.gonxt.tech"
EMAIL="reshigan@gonxt.tech"

# Get current user
CURRENT_USER=$(whoami)
if [ "$CURRENT_USER" = "root" ]; then
    # If running as root, use the actual user who called sudo
    CURRENT_USER=${SUDO_USER:-ubuntu}
fi

# Home directory paths
HOME_DIR="/home/$CURRENT_USER"
APP_DIR="$HOME_DIR/tradeai"
BACKUP_DIR="$HOME_DIR/backups/tradeai-$(date +%Y%m%d-%H%M%S)"

# System paths to clean
OLD_PATHS=(
    "/var/www/tradeai"
    "/var/www/html/tradeai"
    "/opt/tradeai"
    "/root/tradeai"
    "/usr/local/tradeai"
    "/srv/tradeai"
)

# Nginx configuration
NGINX_CONFIG="/etc/nginx/sites-available/tradeai"
NGINX_ENABLED="/etc/nginx/sites-enabled/tradeai"
SSL_DIR="/etc/letsencrypt/live/$DOMAIN"

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

cleanup_step() {
    echo -e "${CYAN}[CLEANUP] $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Create comprehensive backup
create_backup() {
    step "Creating Comprehensive Backup"
    
    # Create backup directory as user
    sudo -u $CURRENT_USER mkdir -p "$BACKUP_DIR"
    
    # Backup existing installations
    for path in "${OLD_PATHS[@]}"; do
        if [ -d "$path" ]; then
            cleanup_step "Backing up: $path"
            cp -r "$path" "$BACKUP_DIR/$(basename $path)-$(echo $path | tr '/' '-')" 2>/dev/null || true
        fi
    done
    
    # Backup nginx config
    if [ -f "$NGINX_CONFIG" ]; then
        cp "$NGINX_CONFIG" "$BACKUP_DIR/nginx-config" 2>/dev/null || true
    fi
    
    # Backup PM2 processes
    if command -v pm2 >/dev/null 2>&1; then
        sudo -u $CURRENT_USER pm2 list > "$BACKUP_DIR/pm2-processes.txt" 2>/dev/null || true
        sudo -u $CURRENT_USER pm2 save 2>/dev/null || true
        cp "/home/$CURRENT_USER/.pm2/dump.pm2" "$BACKUP_DIR/pm2-dump.pm2" 2>/dev/null || true
    fi
    
    # Set proper ownership
    chown -R $CURRENT_USER:$CURRENT_USER "$BACKUP_DIR"
    
    log "✅ Backup created at: $BACKUP_DIR"
}

# Complete system cleanup
complete_cleanup() {
    step "Complete System Cleanup - Removing ALL Old Installations"
    
    # Stop all services
    cleanup_step "Stopping all services..."
    systemctl stop nginx 2>/dev/null || true
    systemctl stop apache2 2>/dev/null || true
    
    # Stop all PM2 processes (for all users)
    cleanup_step "Stopping all PM2 processes..."
    sudo -u $CURRENT_USER pm2 stop all 2>/dev/null || true
    sudo -u $CURRENT_USER pm2 delete all 2>/dev/null || true
    sudo -u $CURRENT_USER pm2 kill 2>/dev/null || true
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    pm2 kill 2>/dev/null || true
    
    # Kill all related processes
    cleanup_step "Killing all related processes..."
    pkill -f nginx 2>/dev/null || true
    pkill -f apache 2>/dev/null || true
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "react-scripts" 2>/dev/null || true
    pkill -f "tradeai" 2>/dev/null || true
    pkill -f "pm2" 2>/dev/null || true
    
    # Remove all old installation directories
    cleanup_step "Removing old installation directories..."
    for path in "${OLD_PATHS[@]}"; do
        if [ -d "$path" ]; then
            warning "Removing: $path"
            rm -rf "$path"
        fi
    done
    
    # Remove nginx configurations
    cleanup_step "Removing nginx configurations..."
    rm -f "$NGINX_ENABLED" "$NGINX_CONFIG"
    rm -f /etc/nginx/sites-enabled/default
    rm -f /etc/nginx/sites-available/default
    
    # Clean up PM2 startup scripts
    cleanup_step "Cleaning PM2 startup scripts..."
    pm2 unstartup systemd 2>/dev/null || true
    sudo -u $CURRENT_USER pm2 unstartup systemd 2>/dev/null || true
    
    # Remove PM2 system files
    rm -rf /etc/systemd/system/pm2-*.service 2>/dev/null || true
    systemctl daemon-reload
    
    # Clean package cache and fix broken packages
    cleanup_step "Cleaning package cache..."
    apt-get clean
    apt-get autoclean
    dpkg --configure -a 2>/dev/null || true
    apt-get -f install -y 2>/dev/null || true
    
    # Remove any conflicting web servers
    cleanup_step "Removing conflicting packages..."
    apt-get remove --purge -y apache2* 2>/dev/null || true
    apt-get autoremove -y 2>/dev/null || true
    
    log "✅ Complete cleanup finished"
}

# Install fresh system dependencies
install_fresh_dependencies() {
    step "Installing Fresh System Dependencies"
    
    # Update system
    log "Updating system packages..."
    apt-get update
    
    # Install essential packages
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
        net-tools \
        htop \
        tree
    
    # Remove any existing Node.js installations
    log "Removing old Node.js installations..."
    apt-get remove --purge -y nodejs npm 2>/dev/null || true
    rm -rf /usr/local/bin/node /usr/local/bin/npm 2>/dev/null || true
    rm -rf /usr/local/lib/node_modules 2>/dev/null || true
    
    # Install Node.js 20.x from NodeSource
    log "Installing fresh Node.js 20.x from NodeSource..."
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
    
    # Remove any global PM2 installations
    npm uninstall -g pm2 2>/dev/null || true
    
    # Install PM2 globally
    log "Installing fresh PM2..."
    npm install -g pm2@latest
    
    # Verify PM2
    pm2_version=$(pm2 --version 2>/dev/null || echo "FAILED")
    if [[ "$pm2_version" == "FAILED" ]]; then
        error "PM2 installation failed"
        exit 1
    fi
    
    log "✅ PM2: $pm2_version"
    
    # Ensure www-data user exists (for nginx)
    if ! id "www-data" &>/dev/null; then
        log "Creating www-data user..."
        useradd --system --gid www-data --no-create-home --home /var/www --shell /usr/sbin/nologin www-data
    fi
    
    log "✅ Fresh dependencies installed successfully"
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
    
    log "✅ Firewall configured successfully"
}

# Setup application in home directory
setup_home_application() {
    step "Setting Up TRADEAI Application in Home Directory"
    
    # Create application directory as user
    log "Creating home application directory: $APP_DIR"
    sudo -u $CURRENT_USER mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # Clone repository as user
    log "Cloning fresh TRADEAI repository..."
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
    
    # Create logs directory
    sudo -u $CURRENT_USER mkdir -p "$APP_DIR/logs"
    
    # Set proper permissions
    chown -R $CURRENT_USER:$CURRENT_USER "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    log "✅ Repository cloned and setup in home directory"
}

# Setup backend service in home
setup_home_backend() {
    step "Setting Up Backend Service in Home Directory"
    
    cd "$APP_DIR/backend"
    
    # Clean npm cache
    sudo -u $CURRENT_USER npm cache clean --force
    
    # Install backend dependencies as user
    log "Installing backend dependencies..."
    sudo -u $CURRENT_USER npm install --production --no-optional --no-audit
    
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
      PORT: $BACKEND_PORT,
      HOME: '$HOME_DIR'
    },
    error_file: '$APP_DIR/logs/backend-error.log',
    out_file: '$APP_DIR/logs/backend-out.log',
    log_file: '$APP_DIR/logs/backend.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    kill_timeout: 5000
  }]
};
EOF
    
    log "✅ Backend setup completed in home directory"
}

# Setup frontend service in home
setup_home_frontend() {
    step "Setting Up Frontend Service in Home Directory"
    
    cd "$APP_DIR/frontend"
    
    # Clean npm cache
    sudo -u $CURRENT_USER npm cache clean --force
    
    # Install frontend dependencies as user
    log "Installing frontend dependencies..."
    sudo -u $CURRENT_USER npm install --no-audit
    
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

// Security middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build'), {
  maxAge: '1d',
  etag: false
}));

// Handle React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${port}`);
  console.log(`Serving from: ${path.join(__dirname, 'build')}`);
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
      PORT: $FRONTEND_PORT,
      HOME: '$HOME_DIR'
    },
    error_file: '$APP_DIR/logs/frontend-error.log',
    out_file: '$APP_DIR/logs/frontend-out.log',
    log_file: '$APP_DIR/logs/frontend.log',
    time: true,
    max_memory_restart: '512M',
    watch: false,
    kill_timeout: 5000
  }]
};
EOF
    
    log "✅ Frontend setup completed in home directory"
}

# Create nginx configuration for home deployment
create_nginx_config() {
    step "Creating Nginx Configuration for Home Deployment"
    
    # Create nginx config
    cat > "$NGINX_CONFIG" << EOF
# TRADEAI Home Deployment Nginx Configuration
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
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
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Enable the site
    ln -sf "$NGINX_CONFIG" "$NGINX_ENABLED"
    
    # Test nginx configuration
    if nginx -t; then
        log "✅ Nginx configuration is valid"
    else
        error "❌ Nginx configuration is invalid"
        nginx -t
        exit 1
    fi
    
    log "✅ Nginx configuration created successfully"
}

# Setup SSL certificate
setup_ssl() {
    step "Setting Up SSL Certificate"
    
    # Start nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Wait for nginx to start
    sleep 3
    
    # Check if nginx is running
    if ! systemctl is-active --quiet nginx; then
        error "Nginx failed to start"
        systemctl status nginx
        exit 1
    fi
    
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

# Start all services in home directory
start_home_services() {
    step "Starting All Services from Home Directory"
    
    # Ensure proper ownership
    chown -R $CURRENT_USER:$CURRENT_USER "$APP_DIR"
    
    # Start backend service as user
    log "Starting backend service..."
    cd "$APP_DIR/backend"
    sudo -u $CURRENT_USER pm2 start ecosystem.backend.js
    
    # Wait for backend to start
    sleep 8
    
    # Check if backend started
    backend_status=$(sudo -u $CURRENT_USER pm2 list | grep "tradeai-backend" || echo "")
    if [ -z "$backend_status" ]; then
        error "Backend failed to start, checking logs..."
        sudo -u $CURRENT_USER pm2 logs tradeai-backend --lines 30 || true
        error "Backend startup failed"
        exit 1
    fi
    
    log "✅ Backend service started successfully"
    
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
        sudo -u $CURRENT_USER pm2 logs tradeai-frontend --lines 30 || true
        error "Frontend startup failed"
        exit 1
    fi
    
    log "✅ Frontend service started successfully"
    
    # Save PM2 configuration
    sudo -u $CURRENT_USER pm2 save
    
    # Setup PM2 startup for the user
    log "Setting up PM2 startup..."
    pm2 startup systemd -u $CURRENT_USER --hp "$HOME_DIR"
    
    # Restart nginx to ensure it's working with the new setup
    systemctl restart nginx
    
    # Wait for nginx to restart
    sleep 3
    
    if ! systemctl is-active --quiet nginx; then
        error "Nginx failed to restart"
        systemctl status nginx
        exit 1
    fi
    
    log "✅ All services started successfully from home directory"
}

# Comprehensive verification
verify_home_deployment() {
    step "Verifying Home Directory Deployment"
    
    # Check nginx
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx is running"
    else
        error "❌ Nginx is not running"
        return 1
    fi
    
    # Check PM2 processes
    log "Checking PM2 processes..."
    sudo -u $CURRENT_USER pm2 list
    
    backend_status=$(sudo -u $CURRENT_USER pm2 list | grep "tradeai-backend" | grep "online" || echo "")
    frontend_status=$(sudo -u $CURRENT_USER pm2 list | grep "tradeai-frontend" | grep "online" || echo "")
    
    if [ -n "$backend_status" ]; then
        log "✅ Backend service is running"
    else
        error "❌ Backend service is not running"
        return 1
    fi
    
    if [ -n "$frontend_status" ]; then
        log "✅ Frontend service is running"
    else
        error "❌ Frontend service is not running"
        return 1
    fi
    
    # Check ports
    log "Checking port availability..."
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
    frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$FRONTEND_PORT 2>/dev/null || echo "000")
    if [ "$frontend_response" = "200" ]; then
        log "✅ Frontend responds to HTTP requests"
    else
        warning "⚠️ Frontend response code: $frontend_response"
    fi
    
    # Test backend health (if available)
    backend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$BACKEND_PORT/api/health 2>/dev/null || echo "000")
    if [ "$backend_response" = "200" ]; then
        log "✅ Backend API responds to requests"
    else
        info "ℹ️ Backend API health check response: $backend_response (may be normal)"
    fi
    
    # Check SSL
    if [ -d "$SSL_DIR" ]; then
        log "✅ SSL certificate is installed"
    else
        info "ℹ️ No SSL certificate (HTTP only)"
    fi
    
    # Check file permissions
    log "Checking file permissions..."
    if [ -O "$APP_DIR" ]; then
        log "✅ Application directory is owned by $CURRENT_USER"
    else
        warning "⚠️ Application directory ownership issue"
    fi
    
    log "✅ Home directory deployment verification completed"
}

# Show final comprehensive information
show_final_info() {
    echo ""
    echo "🎉 TRADEAI CLEAN HOME DEPLOYMENT COMPLETED!"
    echo "=============================================="
    echo ""
    echo "🧹 CLEANUP COMPLETED:"
    echo "   • Removed all old installations from /var/www, /opt, /root"
    echo "   • Cleaned up all PM2 processes and configurations"
    echo "   • Removed conflicting nginx configurations"
    echo "   • Fresh installation of all dependencies"
    echo ""
    echo "🏠 HOME DIRECTORY DEPLOYMENT:"
    echo "   • User: $CURRENT_USER"
    echo "   • Home: $HOME_DIR"
    echo "   • Application: $APP_DIR"
    echo "   • Logs: $APP_DIR/logs/"
    echo "   • Backup: $BACKUP_DIR"
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
    echo "🔧 Management Commands (run as $CURRENT_USER):"
    echo "   • View all logs: pm2 logs"
    echo "   • View backend logs: pm2 logs tradeai-backend"
    echo "   • View frontend logs: pm2 logs tradeai-frontend"
    echo "   • Restart backend: pm2 restart tradeai-backend"
    echo "   • Restart frontend: pm2 restart tradeai-frontend"
    echo "   • Check status: pm2 status"
    echo "   • Save PM2 config: pm2 save"
    echo "   • Monitor processes: pm2 monit"
    echo ""
    echo "🔧 System Management Commands (run as root):"
    echo "   • Restart nginx: sudo systemctl restart nginx"
    echo "   • Check nginx status: sudo systemctl status nginx"
    echo "   • View nginx logs: sudo journalctl -u nginx"
    echo ""
    echo "📁 Directory Structure:"
    echo "   $APP_DIR/"
    echo "   ├── backend/           # Node.js backend service"
    echo "   ├── frontend/          # React frontend (built)"
    echo "   ├── logs/             # PM2 log files"
    echo "   └── ...               # Other project files"
    echo ""
    if [ ! -d "$SSL_DIR" ]; then
        echo "⚠️ SSL Setup:"
        echo "   SSL certificate setup failed or was skipped."
        echo "   To setup SSL manually:"
        echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
        echo ""
    fi
    echo "✅ BENEFITS OF HOME DIRECTORY DEPLOYMENT:"
    echo "   🏠 No permission issues - everything owned by user"
    echo "   🔒 Better security - isolated from system directories"
    echo "   🧹 Easy cleanup - all files in one location"
    echo "   🔧 Simple management - no sudo needed for app operations"
    echo "   📦 Clean separation - system vs application files"
    echo ""
    echo "🚀 TRADEAI Production Platform is Ready!"
    echo "🏠 Clean home directory deployment completed successfully!"
    echo "🎯 All permission issues resolved!"
}

# Main execution
main() {
    echo ""
    echo "🧹🏠 TRADEAI COMPLETE CLEANUP & HOME DEPLOYMENT"
    echo "================================================"
    echo ""
    log "🚀 Starting Complete Cleanup & Home Deployment"
    log "Domain: $DOMAIN"
    log "Email: $EMAIL"
    log "User: $CURRENT_USER"
    log "Home Directory: $HOME_DIR"
    log "Install Directory: $APP_DIR"
    log "Architecture: Multi-service (Backend + Frontend + Nginx)"
    echo ""
    warning "This will remove ALL old installations and deploy fresh in home directory"
    echo ""
    
    check_root
    create_backup
    complete_cleanup
    install_fresh_dependencies
    configure_firewall
    setup_home_application
    setup_home_backend
    setup_home_frontend
    create_nginx_config
    setup_ssl || true
    start_home_services
    verify_home_deployment
    show_final_info
    
    log "🎉 TRADEAI Clean Home Deployment Completed Successfully!"
    log "🏠 All files are now in the home directory with proper permissions!"
    log "🎯 No more permission issues!"
}

# Run main function
main "$@"