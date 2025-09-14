#!/bin/bash

# 🚀 TRADEAI Production Deployment Script - FIXED VERSION
# Complete cleanup, SSL setup, and production deployment
# Domain: reshigan@gonxt.tech
# Author: OpenHands AI Assistant
# Version: 2.3.1 - Fixed dependency conflicts

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="reshigan.gonxt.tech"
EMAIL="reshigan@gonxt.tech"
APP_DIR="/var/www/tradeai"
NGINX_CONFIG="/etc/nginx/sites-available/tradeai"
NGINX_ENABLED="/etc/nginx/sites-enabled/tradeai"
SSL_DIR="/etc/letsencrypt/live/$DOMAIN"
BACKUP_DIR="/var/backups/tradeai-$(date +%Y%m%d-%H%M%S)"

# Logging function
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

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Create backup of existing installation
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

# Clean up old installations and fix broken packages
cleanup_and_fix_packages() {
    log "Cleaning up old installations and fixing package issues..."
    
    # Stop services
    systemctl stop nginx 2>/dev/null || true
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Remove old application directory
    if [ -d "$APP_DIR" ]; then
        warning "Removing old application directory: $APP_DIR"
        rm -rf "$APP_DIR"
    fi
    
    # Remove old nginx configuration
    if [ -f "$NGINX_ENABLED" ]; then
        rm -f "$NGINX_ENABLED"
    fi
    
    if [ -f "$NGINX_CONFIG" ]; then
        rm -f "$NGINX_CONFIG"
    fi
    
    # Clean up old processes
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    
    # Fix broken packages
    log "Fixing broken package dependencies..."
    dpkg --configure -a || true
    apt-get -f install -y || true
    
    # Remove conflicting packages completely
    apt-get remove --purge -y nodejs npm 2>/dev/null || true
    apt-get autoremove -y
    apt-get autoclean
    
    log "Cleanup and package fix completed"
}

# Install system dependencies with proper Node.js setup
install_dependencies() {
    log "Installing system dependencies..."
    
    # Update system
    apt update
    
    # Install basic packages first
    apt install -y \
        nginx \
        git \
        curl \
        wget \
        unzip \
        certbot \
        python3-certbot-nginx \
        ufw \
        build-essential
    
    # Install Node.js using NodeSource repository (more reliable)
    log "Installing Node.js from NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Verify Node.js installation
    node_version=$(node --version 2>/dev/null || echo "not installed")
    npm_version=$(npm --version 2>/dev/null || echo "not installed")
    
    log "Node.js version: $node_version"
    log "npm version: $npm_version"
    
    if [[ "$node_version" == "not installed" ]]; then
        error "Node.js installation failed"
        exit 1
    fi
    
    # Install PM2 globally
    npm install -g pm2
    
    # Create www-data user if it doesn't exist
    if ! id "www-data" &>/dev/null; then
        useradd -r -s /bin/false www-data
    fi
    
    log "Dependencies installed successfully"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (important!)
    ufw allow ssh
    ufw allow 22
    
    # Allow HTTP and HTTPS
    ufw allow 80
    ufw allow 443
    
    # Allow specific ports if needed
    ufw allow 3000  # Node.js app port
    
    # Enable firewall
    ufw --force enable
    
    log "Firewall configured successfully"
}

# Clone and setup application
setup_application() {
    log "Setting up TRADEAI application..."
    
    # Create application directory
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # Clone the repository
    git clone https://github.com/Reshigan/TRADEAI.git .
    
    # Install Node.js dependencies
    log "Installing application dependencies..."
    npm install --production --no-optional
    
    # Set proper permissions
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    # Ensure server.js exists
    if [ ! -f "$APP_DIR/src/server.js" ]; then
        error "Server file not found at $APP_DIR/src/server.js"
        error "Please check the repository structure"
        exit 1
    fi
    
    log "Application setup completed"
}

# Create nginx configuration (HTTP only initially)
create_nginx_config() {
    log "Creating nginx configuration..."
    
    # Ensure nginx directories exist
    mkdir -p /etc/nginx/sites-available
    mkdir -p /etc/nginx/sites-enabled
    mkdir -p /var/www/html
    
    cat > "$NGINX_CONFIG" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    # Serve static files
    location /static/ {
        alias $APP_DIR/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
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
}
EOF
    
    # Remove default nginx site
    rm -f /etc/nginx/sites-enabled/default
    
    # Enable the site
    ln -sf "$NGINX_CONFIG" "$NGINX_ENABLED"
    
    # Test nginx configuration
    nginx -t
    
    log "Nginx configuration created successfully"
}

# Setup SSL certificate
setup_ssl() {
    log "Setting up SSL certificate for $DOMAIN..."
    
    # Start nginx to handle Let's Encrypt challenge
    systemctl start nginx
    systemctl enable nginx
    
    # Wait a moment for nginx to start
    sleep 3
    
    # Check if domain resolves to this server
    log "Checking domain resolution..."
    domain_ip=$(dig +short $DOMAIN 2>/dev/null || echo "")
    server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "")
    
    if [ -z "$domain_ip" ]; then
        warning "Domain $DOMAIN does not resolve to any IP"
        warning "Please ensure DNS is configured correctly"
        warning "Continuing with HTTP only..."
        return 1
    fi
    
    if [ "$domain_ip" != "$server_ip" ]; then
        warning "Domain $DOMAIN resolves to $domain_ip but server IP is $server_ip"
        warning "SSL certificate may fail. Continuing anyway..."
    fi
    
    # Obtain SSL certificate
    log "Requesting SSL certificate..."
    if certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domains "$DOMAIN,www.$DOMAIN" \
        --redirect; then
        
        log "SSL certificate obtained successfully"
        
        # Setup automatic renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        log "SSL certificate auto-renewal configured"
        return 0
    else
        warning "SSL certificate setup failed, continuing with HTTP only"
        warning "You can run 'sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN' later"
        return 1
    fi
}

# Start the application
start_application() {
    log "Starting TRADEAI application..."
    
    cd "$APP_DIR"
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'tradeai',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/tradeai-error.log',
    out_file: '/var/log/pm2/tradeai-out.log',
    log_file: '/var/log/pm2/tradeai.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
EOF
    
    # Create log directory
    mkdir -p /var/log/pm2
    chown -R www-data:www-data /var/log/pm2
    
    # Start the application with PM2 as www-data user
    log "Starting PM2 application..."
    sudo -u www-data pm2 start ecosystem.config.js
    sudo -u www-data pm2 save
    
    # Setup PM2 startup
    pm2 startup systemd -u www-data --hp /var/www
    
    # Wait for application to start
    sleep 5
    
    log "Application started successfully"
}

# Restart services
restart_services() {
    log "Restarting services..."
    
    # Restart nginx
    systemctl restart nginx
    
    # Reload PM2
    sudo -u www-data pm2 reload all
    
    log "Services restarted successfully"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check nginx status
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx is running"
    else
        error "❌ Nginx is not running"
        systemctl status nginx
        return 1
    fi
    
    # Check PM2 status
    if sudo -u www-data pm2 list | grep -q "online"; then
        log "✅ PM2 application is running"
    else
        error "❌ PM2 application is not running"
        sudo -u www-data pm2 list
        return 1
    fi
    
    # Check if port 3000 is listening
    if netstat -tlnp | grep -q ":3000"; then
        log "✅ Application is listening on port 3000"
    else
        error "❌ Application is not listening on port 3000"
        netstat -tlnp | grep ":3000" || true
        return 1
    fi
    
    # Check SSL certificate if it exists
    if [ -d "$SSL_DIR" ]; then
        if openssl x509 -in "$SSL_DIR/fullchain.pem" -text -noout | grep -q "$DOMAIN"; then
            log "✅ SSL certificate is valid"
        else
            warning "⚠️  SSL certificate may have issues"
        fi
    else
        info "ℹ️  No SSL certificate found (HTTP only)"
    fi
    
    # Test HTTP response
    log "Testing HTTP response..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
        log "✅ Application responds to HTTP requests"
    else
        warning "⚠️  Application may not be responding correctly"
    fi
    
    log "Deployment verification completed"
}

# Display final information
show_final_info() {
    echo ""
    echo "🎉 TRADEAI Production Deployment Completed Successfully!"
    echo "=================================================="
    echo ""
    echo "🌐 Your application is now available at:"
    if [ -d "$SSL_DIR" ]; then
        echo "   https://$DOMAIN"
        echo "   https://www.$DOMAIN"
    else
        echo "   http://$DOMAIN"
        echo "   http://www.$DOMAIN"
    fi
    echo ""
    echo "📊 Service Status:"
    echo "   • Nginx: $(systemctl is-active nginx)"
    echo "   • PM2: $(sudo -u www-data pm2 list | grep -c online) processes online"
    echo ""
    echo "📁 Important Paths:"
    echo "   • Application: $APP_DIR"
    echo "   • Nginx Config: $NGINX_CONFIG"
    echo "   • Logs: /var/log/pm2/"
    echo "   • Backup: $BACKUP_DIR"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   • View logs: sudo -u www-data pm2 logs"
    echo "   • Restart app: sudo -u www-data pm2 restart tradeai"
    echo "   • Restart nginx: sudo systemctl restart nginx"
    echo "   • Check SSL: sudo certbot certificates"
    echo "   • Check status: sudo -u www-data pm2 status"
    echo ""
    if [ ! -d "$SSL_DIR" ]; then
        echo "⚠️  SSL Setup:"
        echo "   SSL certificate setup failed or was skipped."
        echo "   To setup SSL manually, run:"
        echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
        echo ""
    fi
    echo "✅ Production deployment is complete and ready!"
}

# Main execution
main() {
    log "Starting TRADEAI Production Deployment - FIXED VERSION"
    log "Domain: $DOMAIN"
    log "Email: $EMAIL"
    echo ""
    
    check_root
    create_backup
    cleanup_and_fix_packages
    install_dependencies
    configure_firewall
    setup_application
    create_nginx_config
    setup_ssl || true  # Continue even if SSL fails
    start_application
    restart_services
    verify_deployment
    show_final_info
    
    log "🚀 TRADEAI Production Deployment Completed Successfully!"
}

# Run main function
main "$@"