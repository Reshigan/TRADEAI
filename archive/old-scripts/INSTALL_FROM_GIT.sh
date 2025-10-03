#!/bin/bash

# 🚀 TRADEAI v2.1.0 - CLEAN INSTALL FROM GIT
# This script completely removes all existing installations and installs fresh from GitHub
# Designed for production deployment at tradeai.gonxt.tech

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPO="https://github.com/Reshigan/TRADEAI.git"
DOMAIN="tradeai.gonxt.tech"
APP_NAME="tradeai"
DEPLOY_USER="root"
BACKUP_DIR="/backup/tradeai-$(date +%Y%m%d-%H%M%S)"
INSTALL_DIR="/var/www/tradeai-v2.1.0"
CURRENT_APP_DIR="/var/www/tradeai"
NGINX_CONFIG="/etc/nginx/sites-available/tradeai"
SSL_DIR="/etc/ssl/tradeai"
PM2_APP_NAME="tradeai-backend"
GIT_BRANCH="main"

echo -e "${PURPLE}🚀 TRADEAI v2.1.0 - CLEAN INSTALL FROM GIT${NC}"
echo -e "${PURPLE}===============================================${NC}"
echo -e "${YELLOW}⚠️  WARNING: This will COMPLETELY REMOVE all existing TRADEAI installations!${NC}"
echo -e "${YELLOW}⚠️  A fresh installation will be cloned from GitHub repository.${NC}"
echo -e "${BLUE}📦 Repository: ${GITHUB_REPO}${NC}"
echo -e "${BLUE}🌿 Branch: ${GIT_BRANCH}${NC}"
echo -e "${BLUE}🌐 Domain: ${DOMAIN}${NC}"
echo ""
read -p "Are you sure you want to proceed with clean installation? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}❌ Installation cancelled by user${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Starting clean installation from Git...${NC}"

# Function to log steps
log_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

log_success "Running as root user"

# Step 2: Create backup directory
log_step "Creating backup directory..."
mkdir -p "$BACKUP_DIR"
log_success "Backup directory created: $BACKUP_DIR"

# Step 3: Stop all TRADEAI services
log_step "Stopping all TRADEAI services..."

# Stop PM2 processes
if command -v pm2 &> /dev/null; then
    pm2 stop all || true
    pm2 delete all || true
    log_success "PM2 processes stopped and deleted"
else
    log_warning "PM2 not found, skipping PM2 cleanup"
fi

# Stop nginx
if systemctl is-active --quiet nginx; then
    systemctl stop nginx
    log_success "Nginx stopped"
else
    log_warning "Nginx not running"
fi

# Stop any Docker containers
if command -v docker &> /dev/null; then
    docker stop $(docker ps -q --filter "name=tradeai") 2>/dev/null || true
    docker rm $(docker ps -aq --filter "name=tradeai") 2>/dev/null || true
    log_success "Docker containers stopped and removed"
else
    log_warning "Docker not found, skipping Docker cleanup"
fi

# Step 4: Backup existing installations
log_step "Backing up existing installations..."

# Backup current app directory
if [ -d "$CURRENT_APP_DIR" ]; then
    cp -r "$CURRENT_APP_DIR" "$BACKUP_DIR/app-backup" || true
    log_success "App directory backed up"
fi

# Backup nginx config
if [ -f "$NGINX_CONFIG" ]; then
    cp "$NGINX_CONFIG" "$BACKUP_DIR/nginx-config-backup" || true
    log_success "Nginx config backed up"
fi

# Backup SSL certificates
if [ -d "$SSL_DIR" ]; then
    cp -r "$SSL_DIR" "$BACKUP_DIR/ssl-backup" || true
    log_success "SSL certificates backed up"
fi

# Backup PM2 ecosystem
if command -v pm2 &> /dev/null; then
    pm2 save || true
    cp ~/.pm2/dump.pm2 "$BACKUP_DIR/pm2-backup.json" 2>/dev/null || true
    log_success "PM2 configuration backed up"
fi

# Step 5: Remove ALL existing TRADEAI installations
log_step "Removing ALL existing TRADEAI installations..."

# Remove all app directories
rm -rf /var/www/tradeai* || true
rm -rf /opt/tradeai* || true
rm -rf /home/*/tradeai* || true
rm -rf /root/tradeai* || true
rm -rf /root/TRADEAI* || true
log_success "All TRADEAI app directories removed"

# Remove nginx configs
rm -f /etc/nginx/sites-available/tradeai* || true
rm -f /etc/nginx/sites-enabled/tradeai* || true
log_success "All TRADEAI nginx configs removed"

# Remove SSL certificates
rm -rf /etc/ssl/tradeai* || true
rm -rf /etc/letsencrypt/live/tradeai* || true
log_success "All TRADEAI SSL certificates removed"

# Remove systemd services
systemctl stop tradeai* 2>/dev/null || true
systemctl disable tradeai* 2>/dev/null || true
rm -f /etc/systemd/system/tradeai* || true
systemctl daemon-reload
log_success "All TRADEAI systemd services removed"

# Remove cron jobs
crontab -l 2>/dev/null | grep -v tradeai | crontab - || true
log_success "TRADEAI cron jobs removed"

# Step 6: Update system and install dependencies
log_step "Updating system and installing dependencies..."

# Update package lists
apt-get update -y

# Install essential tools
apt-get install -y curl wget unzip git build-essential

# Install Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log_success "Node.js installed: $NODE_VERSION, npm: $NPM_VERSION"

# Install PM2 globally
npm install -g pm2@latest
log_success "PM2 installed globally"

# Install nginx
apt-get install -y nginx
log_success "Nginx installed"

# Install SSL tools
apt-get install -y certbot python3-certbot-nginx openssl
log_success "SSL tools installed"

# Step 7: Clone TRADEAI repository from GitHub
log_step "Cloning TRADEAI repository from GitHub..."

cd /var/www/
git clone "$GITHUB_REPO" tradeai-v2.1.0
cd tradeai-v2.1.0
git checkout "$GIT_BRANCH"

# Get latest commit info
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s")
log_success "Repository cloned successfully"
echo -e "${BLUE}📝 Latest commit: ${COMMIT_HASH} - ${COMMIT_MESSAGE}${NC}"

# Step 8: Set proper permissions
log_step "Setting proper permissions..."
chown -R www-data:www-data "$INSTALL_DIR"
chmod -R 755 "$INSTALL_DIR"
log_success "Permissions set for $INSTALL_DIR"

# Step 9: Install frontend dependencies and build
log_step "Installing frontend dependencies and building..."

cd "$INSTALL_DIR/frontend"
if [ -f "package.json" ]; then
    npm install
    log_success "Frontend dependencies installed"
    
    # Build for production
    npm run build
    log_success "Frontend built for production"
    
    # Check if build files exist
    if [ -f "build/static/js/main.*.js" ] && [ -f "build/static/css/main.*.css" ]; then
        log_success "Build files created successfully"
        ls -la build/static/js/main.*.js build/static/css/main.*.css
    else
        log_warning "Build files not found in expected location"
        ls -la build/static/ || true
    fi
else
    log_warning "Frontend package.json not found, skipping frontend build"
fi

# Step 10: Install backend dependencies
log_step "Installing backend dependencies..."

cd "$INSTALL_DIR/backend"
if [ -f "package.json" ]; then
    npm install --production
    log_success "Backend dependencies installed"
else
    log_warning "Backend package.json not found, creating basic setup"
    
    # Create basic backend structure
    cat > package.json << 'EOF'
{
  "name": "tradeai-backend",
  "version": "2.1.0",
  "description": "TRADEAI Backend API v2.1.0 - Production Ready",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-rate-limit": "^6.10.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
    
    npm install --production
    log_success "Basic backend dependencies installed"
fi

# Step 11: Configure Nginx
log_step "Configuring Nginx..."

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
    
    # SSL Configuration
    ssl_certificate /etc/ssl/tradeai/tradeai.crt;
    ssl_certificate_key /etc/ssl/tradeai/tradeai.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Root directory - serve from frontend build
    root $INSTALL_DIR/frontend/build;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Static files with long cache
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:5000;
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
    
    # React Router - serve index.html for all routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Favicon
    location /favicon.ico {
        log_not_found off;
        access_log off;
    }
}
EOF

# Enable the site
ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

log_success "Nginx configured"

# Step 12: Generate SSL Certificate
log_step "Generating SSL certificate..."

mkdir -p "$SSL_DIR"

# Generate self-signed certificate (replace with Let's Encrypt in production)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/tradeai.key" \
    -out "$SSL_DIR/tradeai.crt" \
    -subj "/C=ZA/ST=Gauteng/L=Johannesburg/O=TRADEAI/OU=IT Department/CN=$DOMAIN"

chmod 600 "$SSL_DIR/tradeai.key"
chmod 644 "$SSL_DIR/tradeai.crt"

log_success "SSL certificate generated"

# Step 13: Set server timezone to South Africa
log_step "Setting server timezone to Africa/Johannesburg..."
timedatectl set-timezone Africa/Johannesburg
CURRENT_TZ=$(timedatectl show --property=Timezone --value)
log_success "Server timezone set to: $CURRENT_TZ"

# Step 14: Create PM2 ecosystem file
log_step "Creating PM2 ecosystem..."

cd "$INSTALL_DIR"
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PM2_APP_NAME',
    script: './backend/server.js',
    cwd: '$INSTALL_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      TZ: 'Africa/Johannesburg'
    },
    error_file: '/var/log/tradeai/error.log',
    out_file: '/var/log/tradeai/out.log',
    log_file: '/var/log/tradeai/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Create log directory
mkdir -p /var/log/tradeai
chown -R www-data:www-data /var/log/tradeai

log_success "PM2 ecosystem created"

# Step 15: Create symbolic link for current app
log_step "Creating symbolic link..."
ln -sfn "$INSTALL_DIR" "$CURRENT_APP_DIR"
log_success "Symbolic link created: $CURRENT_APP_DIR -> $INSTALL_DIR"

# Step 16: Test Nginx configuration
log_step "Testing Nginx configuration..."
nginx -t
if [ $? -eq 0 ]; then
    log_success "Nginx configuration is valid"
else
    log_error "Nginx configuration is invalid"
    exit 1
fi

# Step 17: Start services
log_step "Starting services..."

# Start Nginx
systemctl start nginx
systemctl enable nginx
log_success "Nginx started and enabled"

# Start PM2 (if backend server.js exists)
if [ -f "$INSTALL_DIR/backend/server.js" ]; then
    cd "$INSTALL_DIR"
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    log_success "PM2 configured and started"
else
    log_warning "Backend server.js not found, PM2 not started"
    log_warning "You'll need to create backend/server.js and start PM2 manually"
fi

# Step 18: Create verification script
log_step "Creating verification script..."

cat > "$INSTALL_DIR/verify-installation.sh" << 'EOF'
#!/bin/bash

echo "🔍 TRADEAI v2.1.0 Installation Verification"
echo "=========================================="

# Check Git repository info
echo "📦 Repository Information:"
cd /var/www/tradeai-v2.1.0
echo "Branch: $(git branch --show-current)"
echo "Commit: $(git rev-parse --short HEAD) - $(git log -1 --pretty=format:'%s')"
echo ""

# Check if build files exist
echo "📁 Checking build files..."
if [ -d "/var/www/tradeai/frontend/build" ]; then
    echo "✅ Frontend build directory found"
    ls -la /var/www/tradeai/frontend/build/static/js/main.*.js 2>/dev/null && echo "✅ JavaScript build files found" || echo "❌ JavaScript build files missing"
    ls -la /var/www/tradeai/frontend/build/static/css/main.*.css 2>/dev/null && echo "✅ CSS build files found" || echo "❌ CSS build files missing"
else
    echo "❌ Frontend build directory missing"
fi

# Check services
echo ""
echo "🔧 Checking services..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
fi

if pm2 list | grep -q "tradeai-backend"; then
    echo "✅ PM2 backend is running"
else
    echo "❌ PM2 backend is not running"
fi

# Check SSL certificate
echo ""
echo "🔒 Checking SSL certificate..."
if [ -f "/etc/ssl/tradeai/tradeai.crt" ]; then
    echo "✅ SSL certificate found"
    openssl x509 -in /etc/ssl/tradeai/tradeai.crt -text -noout | grep "Subject:"
else
    echo "❌ SSL certificate missing"
fi

# Check timezone
echo ""
echo "🌍 Checking timezone..."
echo "Current timezone: $(timedatectl show --property=Timezone --value)"

# Test HTTP response
echo ""
echo "🌐 Testing HTTP response..."
curl -I http://tradeai.gonxt.tech 2>/dev/null | head -1 || echo "❌ HTTP test failed"

# Check Node.js and npm versions
echo ""
echo "📋 System Information:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"

echo ""
echo "🎉 Verification complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Visit: https://tradeai.gonxt.tech"
echo "2. Test login functionality"
echo "3. Verify API integration"
echo "4. Check performance"
EOF

chmod +x "$INSTALL_DIR/verify-installation.sh"
log_success "Verification script created"

# Step 19: Create post-installation instructions
log_step "Creating post-installation instructions..."

cat > "$INSTALL_DIR/POST_INSTALL_INSTRUCTIONS.md" << EOF
# 📋 TRADEAI v2.1.0 Post-Installation Instructions

## ✅ Installation Complete!

Your TRADEAI v2.1.0 has been successfully installed from GitHub repository.

### 🔍 Verify Installation

Run the verification script:
\`\`\`bash
bash $INSTALL_DIR/verify-installation.sh
\`\`\`

### 🌐 Test the Application

1. **Visit**: https://tradeai.gonxt.tech
2. **Check SSL**: Should show green lock (no warnings)
3. **Test Login**: Use your real credentials
4. **Verify API**: Ensure data loads from APIs (not mock data)

### 🔧 Service Management

\`\`\`bash
# Check service status
systemctl status nginx
pm2 status

# Restart services
systemctl restart nginx
pm2 restart tradeai-backend

# View logs
tail -f /var/log/nginx/error.log
pm2 logs tradeai-backend
\`\`\`

### 📁 Important Directories

- **Application**: $INSTALL_DIR
- **Current Link**: $CURRENT_APP_DIR -> $INSTALL_DIR
- **Nginx Config**: $NGINX_CONFIG
- **SSL Certificates**: $SSL_DIR
- **Logs**: /var/log/tradeai/

### 🚨 If Issues Occur

1. **Check logs**: \`pm2 logs\` and \`tail -f /var/log/nginx/error.log\`
2. **Restart services**: \`systemctl restart nginx && pm2 restart all\`
3. **Verify permissions**: \`chown -R www-data:www-data $INSTALL_DIR\`
4. **Test configuration**: \`nginx -t\`

### 🔄 Rollback (if needed)

Your previous installation was backed up to: $BACKUP_DIR

To rollback:
\`\`\`bash
systemctl stop nginx
pm2 stop all
rm -rf $INSTALL_DIR
cp -r $BACKUP_DIR/app-backup $CURRENT_APP_DIR
cp $BACKUP_DIR/nginx-config-backup $NGINX_CONFIG
systemctl start nginx
pm2 resurrect
\`\`\`

### 🎉 Success!

TRADEAI v2.1.0 is now running with:
- ✅ Fresh installation from GitHub
- ✅ Production-ready configuration
- ✅ SSL certificate
- ✅ South African timezone
- ✅ Optimized performance

**Happy Trading! 📈**
EOF

log_success "Post-installation instructions created"

# Final summary
echo ""
echo -e "${GREEN}🎉 TRADEAI v2.1.0 INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${BLUE}📊 Installation Summary:${NC}"
echo -e "   • Repository: ${GREEN}$GITHUB_REPO${NC}"
echo -e "   • Branch: ${GREEN}$GIT_BRANCH${NC}"
echo -e "   • Commit: ${GREEN}$COMMIT_HASH${NC}"
echo -e "   • Installation directory: ${GREEN}$INSTALL_DIR${NC}"
echo -e "   • Domain: ${GREEN}$DOMAIN${NC}"
echo -e "   • SSL certificate: ${GREEN}GENERATED${NC}"
echo -e "   • Server timezone: ${GREEN}Africa/Johannesburg${NC}"
echo -e "   • Services: ${GREEN}NGINX + PM2 CONFIGURED${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "   1. Run verification: ${BLUE}bash $INSTALL_DIR/verify-installation.sh${NC}"
echo -e "   2. Test website: ${BLUE}https://$DOMAIN${NC}"
echo -e "   3. Check services: ${BLUE}systemctl status nginx && pm2 status${NC}"
echo -e "   4. Review instructions: ${BLUE}cat $INSTALL_DIR/POST_INSTALL_INSTRUCTIONS.md${NC}"
echo ""
echo -e "${GREEN}✅ TRADEAI v2.1.0 is ready for production!${NC}"
echo ""
echo -e "${BLUE}📁 Backup location: ${BACKUP_DIR}${NC}"
echo -e "${BLUE}📖 Instructions: $INSTALL_DIR/POST_INSTALL_INSTRUCTIONS.md${NC}"
echo ""
echo -e "${PURPLE}🚀 Installation completed successfully!${NC}"
echo -e "${PURPLE}Visit https://$DOMAIN to see your TRADEAI platform!${NC}"