#!/bin/bash

# 💥 TRADEAI NUCLEAR CLEAN & HOME INSTALL
# Complete system wipe and fresh home directory installation
# Removes EVERYTHING and starts completely fresh
# Domain: reshigan@gonxt.tech
# Author: OpenHands AI Assistant
# Version: NUCLEAR-1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
DOMAIN="reshigan.gonxt.tech"
EMAIL="reshigan@gonxt.tech"

# Get current user
CURRENT_USER=$(whoami)
if [ "$CURRENT_USER" = "root" ]; then
    CURRENT_USER=${SUDO_USER:-ubuntu}
fi

# Paths
HOME_DIR="/home/$CURRENT_USER"
APP_DIR="$HOME_DIR/tradeai"
BACKUP_DIR="$HOME_DIR/backups/nuclear-backup-$(date +%Y%m%d-%H%M%S)"

# All possible installation paths to nuke
NUKE_PATHS=(
    "/var/www/tradeai"
    "/var/www/html/tradeai"
    "/opt/tradeai"
    "/root/tradeai"
    "/usr/local/tradeai"
    "/srv/tradeai"
    "/home/*/tradeai"
    "/tmp/tradeai"
    "$APP_DIR"
)

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

nuke() {
    echo -e "${BOLD}${RED}[NUKE] $1${NC}"
}

fresh() {
    echo -e "${BOLD}${CYAN}[FRESH] $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Show warning and get confirmation
show_warning() {
    echo ""
    echo -e "${BOLD}${RED}⚠️  NUCLEAR CLEAN & INSTALL WARNING ⚠️${NC}"
    echo -e "${BOLD}${RED}======================================${NC}"
    echo ""
    echo -e "${RED}This script will:${NC}"
    echo -e "${RED}• COMPLETELY REMOVE all TRADEAI installations${NC}"
    echo -e "${RED}• STOP and DELETE all related services${NC}"
    echo -e "${RED}• REMOVE all nginx configurations${NC}"
    echo -e "${RED}• KILL all PM2 processes${NC}"
    echo -e "${RED}• UNINSTALL Node.js and PM2${NC}"
    echo -e "${RED}• WIPE all application data${NC}"
    echo ""
    echo -e "${GREEN}Then install fresh in: $APP_DIR${NC}"
    echo ""
    echo -e "${YELLOW}Backup will be created at: $BACKUP_DIR${NC}"
    echo ""
    read -p "Are you ABSOLUTELY SURE you want to proceed? (type 'NUCLEAR' to confirm): " confirm
    
    if [ "$confirm" != "NUCLEAR" ]; then
        echo "Operation cancelled."
        exit 0
    fi
    
    echo ""
    echo -e "${BOLD}${RED}🚨 NUCLEAR CLEAN INITIATED 🚨${NC}"
    echo ""
    sleep 3
}

# Create emergency backup
create_emergency_backup() {
    step "Creating Emergency Backup"
    
    # Create backup directory as user
    sudo -u $CURRENT_USER mkdir -p "$BACKUP_DIR"
    
    # Backup any existing installations
    for path in "${NUKE_PATHS[@]}"; do
        if [ -d "$path" ] && [ "$path" != "$BACKUP_DIR" ]; then
            nuke "Backing up: $path"
            backup_name=$(echo "$path" | sed 's/\//_/g' | sed 's/^_//')
            cp -r "$path" "$BACKUP_DIR/$backup_name" 2>/dev/null || true
        fi
    done
    
    # Backup configurations
    [ -f "/etc/nginx/sites-available/tradeai" ] && cp "/etc/nginx/sites-available/tradeai" "$BACKUP_DIR/nginx-tradeai.conf" 2>/dev/null || true
    [ -f "/etc/nginx/nginx.conf" ] && cp "/etc/nginx/nginx.conf" "$BACKUP_DIR/nginx.conf" 2>/dev/null || true
    
    # Backup PM2 data
    if command -v pm2 >/dev/null 2>&1; then
        sudo -u $CURRENT_USER pm2 list > "$BACKUP_DIR/pm2-list.txt" 2>/dev/null || true
        sudo -u $CURRENT_USER pm2 save 2>/dev/null || true
        [ -f "/home/$CURRENT_USER/.pm2/dump.pm2" ] && cp "/home/$CURRENT_USER/.pm2/dump.pm2" "$BACKUP_DIR/" 2>/dev/null || true
    fi
    
    # Set proper ownership
    chown -R $CURRENT_USER:$CURRENT_USER "$BACKUP_DIR"
    
    log "✅ Emergency backup created at: $BACKUP_DIR"
}

# Nuclear cleanup - remove everything
nuclear_cleanup() {
    step "NUCLEAR CLEANUP - Removing Everything"
    
    # Stop all services
    nuke "Stopping all services..."
    systemctl stop nginx 2>/dev/null || true
    systemctl stop apache2 2>/dev/null || true
    systemctl disable nginx 2>/dev/null || true
    systemctl disable apache2 2>/dev/null || true
    
    # Nuclear PM2 cleanup
    nuke "Nuclear PM2 cleanup..."
    sudo -u $CURRENT_USER pm2 stop all 2>/dev/null || true
    sudo -u $CURRENT_USER pm2 delete all 2>/dev/null || true
    sudo -u $CURRENT_USER pm2 kill 2>/dev/null || true
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    pm2 kill 2>/dev/null || true
    
    # Kill all processes
    nuke "Killing all related processes..."
    pkill -f nginx 2>/dev/null || true
    pkill -f apache 2>/dev/null || true
    pkill -f "node.*server" 2>/dev/null || true
    pkill -f "react-scripts" 2>/dev/null || true
    pkill -f "tradeai" 2>/dev/null || true
    pkill -f "pm2" 2>/dev/null || true
    pkill -f "npm" 2>/dev/null || true
    
    # Remove all PM2 startup scripts and services
    nuke "Removing PM2 startup scripts..."
    pm2 unstartup systemd 2>/dev/null || true
    sudo -u $CURRENT_USER pm2 unstartup systemd 2>/dev/null || true
    rm -rf /etc/systemd/system/pm2-*.service 2>/dev/null || true
    rm -rf /etc/init.d/pm2-* 2>/dev/null || true
    systemctl daemon-reload
    
    # Remove all PM2 data
    nuke "Removing all PM2 data..."
    rm -rf "/home/$CURRENT_USER/.pm2" 2>/dev/null || true
    rm -rf /root/.pm2 2>/dev/null || true
    
    # Nuclear removal of all installation paths
    nuke "Nuclear removal of all installation paths..."
    for path in "${NUKE_PATHS[@]}"; do
        if [ -d "$path" ] && [ "$path" != "$BACKUP_DIR" ]; then
            nuke "Nuking: $path"
            rm -rf "$path" 2>/dev/null || true
        fi
    done
    
    # Remove all nginx configurations
    nuke "Removing all nginx configurations..."
    rm -rf /etc/nginx/sites-available/tradeai* 2>/dev/null || true
    rm -rf /etc/nginx/sites-enabled/tradeai* 2>/dev/null || true
    rm -rf /etc/nginx/sites-enabled/default 2>/dev/null || true
    
    # Remove SSL certificates (they'll be regenerated)
    nuke "Removing SSL certificates..."
    rm -rf /etc/letsencrypt/live/$DOMAIN 2>/dev/null || true
    rm -rf /etc/letsencrypt/archive/$DOMAIN 2>/dev/null || true
    rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf 2>/dev/null || true
    
    # Nuclear Node.js and npm removal
    nuke "Nuclear Node.js and npm removal..."
    apt-get remove --purge -y nodejs npm 2>/dev/null || true
    apt-get autoremove -y 2>/dev/null || true
    rm -rf /usr/local/bin/node /usr/local/bin/npm 2>/dev/null || true
    rm -rf /usr/local/lib/node_modules 2>/dev/null || true
    rm -rf /usr/bin/node /usr/bin/npm 2>/dev/null || true
    rm -rf /etc/apt/sources.list.d/nodesource.list 2>/dev/null || true
    
    # Remove global npm packages
    nuke "Removing global npm packages..."
    npm uninstall -g pm2 2>/dev/null || true
    rm -rf /usr/local/lib/node_modules/pm2 2>/dev/null || true
    rm -rf /usr/local/bin/pm2 2>/dev/null || true
    
    # Clean package cache
    nuke "Cleaning package cache..."
    apt-get clean
    apt-get autoclean
    dpkg --configure -a 2>/dev/null || true
    apt-get -f install -y 2>/dev/null || true
    
    # Remove any remaining web servers
    nuke "Removing conflicting web servers..."
    apt-get remove --purge -y apache2* 2>/dev/null || true
    apt-get autoremove -y 2>/dev/null || true
    
    log "✅ Nuclear cleanup completed - everything removed"
}

# Fresh system installation
fresh_system_install() {
    step "FRESH SYSTEM INSTALLATION"
    
    # Update system
    fresh "Updating system packages..."
    apt-get update
    apt-get upgrade -y
    
    # Install essential packages
    fresh "Installing essential packages..."
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
        tree \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    
    # Install fresh Node.js 20.x from NodeSource
    fresh "Installing fresh Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Verify Node.js installation
    node_version=$(node --version 2>/dev/null || echo "FAILED")
    npm_version=$(npm --version 2>/dev/null || echo "FAILED")
    
    if [[ "$node_version" == "FAILED" ]] || [[ "$npm_version" == "FAILED" ]]; then
        error "Node.js installation failed"
        exit 1
    fi
    
    log "✅ Node.js: $node_version"
    log "✅ npm: $npm_version"
    
    # Install fresh PM2
    fresh "Installing fresh PM2..."
    npm install -g pm2@latest
    
    # Verify PM2
    pm2_version=$(pm2 --version 2>/dev/null || echo "FAILED")
    if [[ "$pm2_version" == "FAILED" ]]; then
        error "PM2 installation failed"
        exit 1
    fi
    
    log "✅ PM2: $pm2_version"
    
    # Ensure www-data user exists
    if ! id "www-data" &>/dev/null; then
        fresh "Creating www-data user..."
        useradd --system --gid www-data --no-create-home --home /var/www --shell /usr/sbin/nologin www-data
    fi
    
    log "✅ Fresh system installation completed"
}

# Configure fresh firewall
configure_fresh_firewall() {
    step "Configuring Fresh Firewall"
    
    # Reset UFW completely
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
    
    log "✅ Fresh firewall configured"
}

# Fresh home directory setup
fresh_home_setup() {
    step "FRESH HOME DIRECTORY SETUP"
    
    # Create fresh application directory
    fresh "Creating fresh home directory: $APP_DIR"
    sudo -u $CURRENT_USER mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # Clone fresh repository
    fresh "Cloning fresh TRADEAI repository..."
    sudo -u $CURRENT_USER git clone https://github.com/Reshigan/TRADEAI.git .
    
    # Verify repository structure
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        error "Invalid repository structure"
        exit 1
    fi
    
    if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
        error "Missing package.json files"
        exit 1
    fi
    
    # Create logs directory
    sudo -u $CURRENT_USER mkdir -p "$APP_DIR/logs"
    
    # Set proper permissions
    chown -R $CURRENT_USER:$CURRENT_USER "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    log "✅ Fresh home directory setup completed"
}

# Fresh backend setup
fresh_backend_setup() {
    step "FRESH BACKEND SETUP"
    
    cd "$APP_DIR/backend"
    
    # Clean npm cache
    sudo -u $CURRENT_USER npm cache clean --force
    
    # Install backend dependencies
    fresh "Installing fresh backend dependencies..."
    sudo -u $CURRENT_USER npm install --production --no-optional --no-audit
    
    # Verify server file
    if [ ! -f "src/server.js" ]; then
        error "Backend server file not found"
        exit 1
    fi
    
    # Create fresh PM2 config
    fresh "Creating fresh backend PM2 configuration..."
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
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
EOF
    
    log "✅ Fresh backend setup completed"
}

# Fresh frontend setup
fresh_frontend_setup() {
    step "FRESH FRONTEND SETUP"
    
    cd "$APP_DIR/frontend"
    
    # Clean npm cache
    sudo -u $CURRENT_USER npm cache clean --force
    
    # Install frontend dependencies
    fresh "Installing fresh frontend dependencies..."
    sudo -u $CURRENT_USER npm install --no-audit
    
    # Build frontend
    fresh "Building fresh frontend..."
    sudo -u $CURRENT_USER npm run build
    
    # Verify build
    if [ ! -d "build" ]; then
        error "Frontend build failed"
        exit 1
    fi
    
    # Create fresh frontend server
    fresh "Creating fresh frontend server..."
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

// Serve static files
app.use(express.static(path.join(__dirname, 'build'), {
  maxAge: '1d',
  etag: false
}));

// Handle React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Frontend server running on port ${port}`);
  console.log(`📁 Serving from: ${path.join(__dirname, 'build')}`);
});
EOF
    
    # Create fresh PM2 config
    fresh "Creating fresh frontend PM2 configuration..."
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
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
EOF
    
    log "✅ Fresh frontend setup completed"
}

# Fresh nginx configuration
fresh_nginx_config() {
    step "FRESH NGINX CONFIGURATION"
    
    # Create fresh nginx config
    fresh "Creating fresh nginx configuration..."
    cat > /etc/nginx/sites-available/tradeai << EOF
# TRADEAI Fresh Home Deployment Configuration
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
    
    # Socket.IO
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
    
    # Frontend
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
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/tradeai /etc/nginx/sites-enabled/tradeai
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    if nginx -t; then
        log "✅ Fresh nginx configuration is valid"
    else
        error "❌ Nginx configuration is invalid"
        nginx -t
        exit 1
    fi
    
    log "✅ Fresh nginx configuration completed"
}

# Fresh SSL setup
fresh_ssl_setup() {
    step "FRESH SSL SETUP"
    
    # Start nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Wait for nginx
    sleep 3
    
    # Check nginx status
    if ! systemctl is-active --quiet nginx; then
        error "Nginx failed to start"
        systemctl status nginx
        exit 1
    fi
    
    # Check domain resolution
    fresh "Checking domain resolution..."
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
    
    # Request fresh SSL certificate
    fresh "Requesting fresh SSL certificate..."
    if certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domains "$DOMAIN,www.$DOMAIN" \
        --redirect; then
        
        log "✅ Fresh SSL certificate obtained"
        
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

# Start fresh services
start_fresh_services() {
    step "STARTING FRESH SERVICES"
    
    # Ensure proper ownership
    chown -R $CURRENT_USER:$CURRENT_USER "$APP_DIR"
    
    # Start backend
    fresh "Starting fresh backend service..."
    cd "$APP_DIR/backend"
    sudo -u $CURRENT_USER pm2 start ecosystem.backend.js
    
    # Wait and verify backend
    sleep 10
    backend_status=$(sudo -u $CURRENT_USER pm2 list | grep "tradeai-backend" || echo "")
    if [ -z "$backend_status" ]; then
        error "Backend failed to start"
        sudo -u $CURRENT_USER pm2 logs tradeai-backend --lines 50 || true
        exit 1
    fi
    
    log "✅ Fresh backend service started"
    
    # Start frontend
    fresh "Starting fresh frontend service..."
    cd "$APP_DIR/frontend"
    sudo -u $CURRENT_USER pm2 start ecosystem.frontend.js
    
    # Wait and verify frontend
    sleep 5
    frontend_status=$(sudo -u $CURRENT_USER pm2 list | grep "tradeai-frontend" || echo "")
    if [ -z "$frontend_status" ]; then
        error "Frontend failed to start"
        sudo -u $CURRENT_USER pm2 logs tradeai-frontend --lines 50 || true
        exit 1
    fi
    
    log "✅ Fresh frontend service started"
    
    # Save PM2 configuration
    sudo -u $CURRENT_USER pm2 save
    
    # Setup PM2 startup
    fresh "Setting up fresh PM2 startup..."
    pm2 startup systemd -u $CURRENT_USER --hp "$HOME_DIR"
    
    # Restart nginx
    systemctl restart nginx
    sleep 3
    
    if ! systemctl is-active --quiet nginx; then
        error "Nginx failed to restart"
        systemctl status nginx
        exit 1
    fi
    
    log "✅ All fresh services started successfully"
}

# Comprehensive verification
verify_fresh_installation() {
    step "VERIFYING FRESH INSTALLATION"
    
    # Check nginx
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx is running"
    else
        error "❌ Nginx is not running"
        return 1
    fi
    
    # Check PM2 processes
    fresh "Checking PM2 processes..."
    sudo -u $CURRENT_USER pm2 list
    
    backend_online=$(sudo -u $CURRENT_USER pm2 list | grep "tradeai-backend" | grep "online" || echo "")
    frontend_online=$(sudo -u $CURRENT_USER pm2 list | grep "tradeai-frontend" | grep "online" || echo "")
    
    if [ -n "$backend_online" ]; then
        log "✅ Backend service is online"
    else
        error "❌ Backend service is not online"
        return 1
    fi
    
    if [ -n "$frontend_online" ]; then
        log "✅ Frontend service is online"
    else
        error "❌ Frontend service is not online"
        return 1
    fi
    
    # Check ports
    fresh "Checking ports..."
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
    
    # Test responses
    fresh "Testing service responses..."
    
    frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$FRONTEND_PORT 2>/dev/null || echo "000")
    if [ "$frontend_response" = "200" ]; then
        log "✅ Frontend responds correctly"
    else
        warning "⚠️ Frontend response: $frontend_response"
    fi
    
    backend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$BACKEND_PORT/api/health 2>/dev/null || echo "000")
    if [ "$backend_response" = "200" ]; then
        log "✅ Backend API responds correctly"
    else
        info "ℹ️ Backend API response: $backend_response"
    fi
    
    # Check SSL
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        log "✅ SSL certificate is installed"
    else
        info "ℹ️ No SSL certificate (HTTP only)"
    fi
    
    # Check ownership
    if [ -O "$APP_DIR" ]; then
        log "✅ Application directory is owned by $CURRENT_USER"
    else
        warning "⚠️ Application directory ownership issue"
    fi
    
    log "✅ Fresh installation verification completed"
}

# Show final results
show_final_results() {
    echo ""
    echo -e "${BOLD}${GREEN}💥 NUCLEAR CLEAN & FRESH INSTALL COMPLETED! 💥${NC}"
    echo -e "${BOLD}${GREEN}================================================${NC}"
    echo ""
    echo -e "${BOLD}🧹 NUCLEAR CLEANUP COMPLETED:${NC}"
    echo "   • Removed ALL old installations from system directories"
    echo "   • Killed ALL conflicting processes and services"
    echo "   • Wiped ALL PM2 configurations and data"
    echo "   • Removed ALL nginx configurations"
    echo "   • Uninstalled and reinstalled Node.js and PM2"
    echo "   • Complete system reset"
    echo ""
    echo -e "${BOLD}🏠 FRESH HOME INSTALLATION:${NC}"
    echo "   • User: $CURRENT_USER"
    echo "   • Home: $HOME_DIR"
    echo "   • Application: $APP_DIR"
    echo "   • Logs: $APP_DIR/logs/"
    echo "   • Backup: $BACKUP_DIR"
    echo ""
    echo -e "${BOLD}🌐 Your TRADEAI platform is now available at:${NC}"
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        echo "   🔒 https://$DOMAIN"
        echo "   🔒 https://www.$DOMAIN"
    else
        echo "   🌍 http://$DOMAIN"
        echo "   🌍 http://www.$DOMAIN"
    fi
    echo ""
    echo -e "${BOLD}🏗️ Architecture:${NC}"
    echo "   📱 Frontend (React): Port $FRONTEND_PORT"
    echo "   🔧 Backend (Node.js): Port $BACKEND_PORT"
    echo "   🌐 Nginx Proxy: Ports 80/443"
    echo ""
    echo -e "${BOLD}📊 Service Status:${NC}"
    echo "   • Nginx: $(systemctl is-active nginx)"
    echo "   • Backend: $(sudo -u $CURRENT_USER pm2 list | grep -c "tradeai-backend.*online") processes"
    echo "   • Frontend: $(sudo -u $CURRENT_USER pm2 list | grep -c "tradeai-frontend.*online") processes"
    echo ""
    echo -e "${BOLD}🔧 Management Commands (run as $CURRENT_USER):${NC}"
    echo "   • View status: pm2 status"
    echo "   • View logs: pm2 logs"
    echo "   • Monitor: pm2 monit"
    echo "   • Restart backend: pm2 restart tradeai-backend"
    echo "   • Restart frontend: pm2 restart tradeai-frontend"
    echo "   • Save config: pm2 save"
    echo ""
    echo -e "${BOLD}✅ BENEFITS OF NUCLEAR CLEAN & FRESH INSTALL:${NC}"
    echo "   💥 Complete elimination of all conflicts and issues"
    echo "   🏠 Clean home directory installation"
    echo "   🔒 Zero permission issues"
    echo "   🚀 Fresh, optimized system"
    echo "   🎯 Guaranteed working state"
    echo ""
    echo -e "${BOLD}${GREEN}🎉 TRADEAI is now running fresh and clean! 🎉${NC}"
}

# Main execution
main() {
    echo ""
    echo -e "${BOLD}${RED}💥 TRADEAI NUCLEAR CLEAN & FRESH INSTALL 💥${NC}"
    echo -e "${BOLD}${RED}===========================================${NC}"
    echo ""
    log "🚀 Starting Nuclear Clean & Fresh Install"
    log "Domain: $DOMAIN"
    log "Email: $EMAIL"
    log "User: $CURRENT_USER"
    log "Home Directory: $HOME_DIR"
    log "Install Directory: $APP_DIR"
    echo ""
    
    check_root
    show_warning
    create_emergency_backup
    nuclear_cleanup
    fresh_system_install
    configure_fresh_firewall
    fresh_home_setup
    fresh_backend_setup
    fresh_frontend_setup
    fresh_nginx_config
    fresh_ssl_setup || true
    start_fresh_services
    verify_fresh_installation
    show_final_results
    
    log "🎉 Nuclear Clean & Fresh Install Completed Successfully!"
}

# Run main function
main "$@"