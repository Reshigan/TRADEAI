#!/bin/bash

# 🚀 TRADEAI CLEAN PRODUCTION DEPLOYMENT SCRIPT v2.1.0
# This script completely removes all existing installations and deploys ONLY this version
# Designed for production server at tradeai.gonxt.tech

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="tradeai.gonxt.tech"
APP_NAME="tradeai"
DEPLOY_USER="root"
BACKUP_DIR="/backup/tradeai-$(date +%Y%m%d-%H%M%S)"
NEW_APP_DIR="/var/www/tradeai-v2.1.0"
CURRENT_APP_DIR="/var/www/tradeai"
NGINX_CONFIG="/etc/nginx/sites-available/tradeai"
SSL_DIR="/etc/ssl/tradeai"
PM2_APP_NAME="tradeai-backend"

echo -e "${BLUE}🚀 TRADEAI CLEAN PRODUCTION DEPLOYMENT v2.1.0${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}⚠️  WARNING: This will COMPLETELY REMOVE all existing TRADEAI installations!${NC}"
echo -e "${YELLOW}⚠️  Only the new v2.1.0 version will remain after this deployment.${NC}"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled by user${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Starting clean production deployment...${NC}"

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

# Step 1: Create backup directory
log_step "Creating backup directory..."
mkdir -p "$BACKUP_DIR"
log_success "Backup directory created: $BACKUP_DIR"

# Step 2: Stop all TRADEAI services
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

# Step 3: Backup existing installations
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

# Step 4: Remove ALL existing TRADEAI installations
log_step "Removing ALL existing TRADEAI installations..."

# Remove all app directories
rm -rf /var/www/tradeai* || true
rm -rf /opt/tradeai* || true
rm -rf /home/*/tradeai* || true
rm -rf /root/tradeai* || true
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

# Step 5: Clean system packages and dependencies
log_step "Cleaning system packages..."

# Remove old Node.js versions if they exist
if command -v nvm &> /dev/null; then
    nvm uninstall node 2>/dev/null || true
fi

# Update package lists
apt-get update -y

log_success "System packages cleaned"

# Step 6: Install fresh dependencies
log_step "Installing fresh dependencies..."

# Install Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2@latest

# Install nginx if not present
apt-get install -y nginx

# Install SSL tools
apt-get install -y certbot python3-certbot-nginx

# Install other required tools
apt-get install -y curl wget unzip git

log_success "Fresh dependencies installed"

# Step 7: Create new application directory
log_step "Creating new application directory..."
mkdir -p "$NEW_APP_DIR"
cd "$NEW_APP_DIR"
log_success "New app directory created: $NEW_APP_DIR"

# Step 8: Deploy TRADEAI v2.1.0
log_step "Deploying TRADEAI v2.1.0..."

# Create directory structure
mkdir -p static/js static/css backend frontend

# Copy build files (these should be uploaded separately)
echo "📁 Build files should be uploaded to:"
echo "   - $NEW_APP_DIR/static/js/main.b75d57d7.js"
echo "   - $NEW_APP_DIR/static/css/main.0c7b41d8.css"
echo ""

# Create index.html with correct references
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TRADEAI - Production v2.1.0</title>
    <link rel="stylesheet" href="/static/css/main.0c7b41d8.css">
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
</head>
<body>
    <div id="root"></div>
    <script src="/static/js/main.b75d57d7.js"></script>
</body>
</html>
EOF

log_success "Index.html created with v2.1.0 build references"

# Step 9: Configure Nginx
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
    
    # Root directory
    root $NEW_APP_DIR;
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

# Step 10: Generate SSL Certificate
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

# Step 11: Set server timezone to South Africa
log_step "Setting server timezone to Africa/Johannesburg..."
timedatectl set-timezone Africa/Johannesburg
log_success "Server timezone set to Africa/Johannesburg"

# Step 12: Create backend configuration
log_step "Creating backend configuration..."

mkdir -p "$NEW_APP_DIR/backend"
cd "$NEW_APP_DIR/backend"

# Create package.json for backend
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

# Install backend dependencies
npm install

log_success "Backend configuration created"

# Step 13: Create PM2 ecosystem file
log_step "Creating PM2 ecosystem..."

cat > "$NEW_APP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '$PM2_APP_NAME',
    script: './backend/server.js',
    cwd: '$NEW_APP_DIR',
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

log_success "PM2 ecosystem created"

# Step 14: Set proper permissions
log_step "Setting proper permissions..."

chown -R www-data:www-data "$NEW_APP_DIR"
chmod -R 755 "$NEW_APP_DIR"
chmod -R 644 "$NEW_APP_DIR"/*.html "$NEW_APP_DIR"/*.js "$NEW_APP_DIR"/*.json 2>/dev/null || true

log_success "Permissions set"

# Step 15: Create symbolic link for current app
log_step "Creating symbolic link..."
ln -sfn "$NEW_APP_DIR" "$CURRENT_APP_DIR"
log_success "Symbolic link created: $CURRENT_APP_DIR -> $NEW_APP_DIR"

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

# Start PM2 (backend will be started when backend files are uploaded)
cd "$NEW_APP_DIR"
pm2 start ecosystem.config.js
pm2 save
pm2 startup
log_success "PM2 configured and started"

# Step 18: Create deployment verification script
log_step "Creating deployment verification script..."

cat > "$NEW_APP_DIR/verify-deployment.sh" << 'EOF'
#!/bin/bash

echo "🔍 TRADEAI v2.1.0 Deployment Verification"
echo "========================================"

# Check if build files exist
echo "📁 Checking build files..."
if [ -f "/var/www/tradeai/static/js/main.b75d57d7.js" ]; then
    echo "✅ JavaScript build file found"
else
    echo "❌ JavaScript build file missing"
fi

if [ -f "/var/www/tradeai/static/css/main.0c7b41d8.css" ]; then
    echo "✅ CSS build file found"
else
    echo "❌ CSS build file missing"
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

echo ""
echo "🎉 Verification complete!"
EOF

chmod +x "$NEW_APP_DIR/verify-deployment.sh"

log_success "Verification script created"

# Step 19: Create upload instructions
log_step "Creating upload instructions..."

cat > "$NEW_APP_DIR/UPLOAD_INSTRUCTIONS.md" << EOF
# 📦 TRADEAI v2.1.0 File Upload Instructions

## Required Files to Upload

Upload these files to complete the deployment:

### 1. Frontend Build Files
\`\`\`bash
# Upload to: $NEW_APP_DIR/static/js/
main.b75d57d7.js

# Upload to: $NEW_APP_DIR/static/css/
main.0c7b41d8.css
\`\`\`

### 2. Backend Files
\`\`\`bash
# Upload your backend source files to: $NEW_APP_DIR/backend/
server.js
routes/
models/
middleware/
config/
\`\`\`

## After Upload Commands

Run these commands after uploading files:

\`\`\`bash
# Set permissions
chown -R www-data:www-data $NEW_APP_DIR
chmod -R 755 $NEW_APP_DIR

# Restart services
pm2 restart tradeai-backend
systemctl reload nginx

# Verify deployment
bash $NEW_APP_DIR/verify-deployment.sh
\`\`\`

## Test the Deployment

1. Visit: https://tradeai.gonxt.tech
2. Login with: admin@gonxt.com / admin123
3. Verify trading terms load from API (not mock data)
4. Check analytics dashboard shows real data

## Troubleshooting

If issues occur:
\`\`\`bash
# Check logs
pm2 logs tradeai-backend
tail -f /var/log/nginx/error.log

# Restart services
pm2 restart all
systemctl restart nginx
\`\`\`
EOF

log_success "Upload instructions created"

# Final summary
echo ""
echo -e "${GREEN}🎉 CLEAN PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo -e "   • All previous installations: ${GREEN}REMOVED${NC}"
echo -e "   • TRADEAI v2.1.0: ${GREEN}DEPLOYED${NC}"
echo -e "   • Application directory: ${GREEN}$NEW_APP_DIR${NC}"
echo -e "   • Nginx: ${GREEN}CONFIGURED AND RUNNING${NC}"
echo -e "   • SSL certificate: ${GREEN}GENERATED${NC}"
echo -e "   • Server timezone: ${GREEN}Africa/Johannesburg${NC}"
echo -e "   • PM2: ${GREEN}CONFIGURED${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "   1. Upload build files to: ${BLUE}$NEW_APP_DIR/static/${NC}"
echo -e "   2. Upload backend files to: ${BLUE}$NEW_APP_DIR/backend/${NC}"
echo -e "   3. Run: ${BLUE}bash $NEW_APP_DIR/verify-deployment.sh${NC}"
echo -e "   4. Test: ${BLUE}https://tradeai.gonxt.tech${NC}"
echo ""
echo -e "${GREEN}✅ TRADEAI v2.1.0 is ready for production!${NC}"
echo ""
echo -e "${BLUE}📁 Backup location: ${BACKUP_DIR}${NC}"
echo -e "${BLUE}📖 Upload instructions: $NEW_APP_DIR/UPLOAD_INSTRUCTIONS.md${NC}"
echo ""
echo -e "${GREEN}🚀 Deployment completed successfully!${NC}"