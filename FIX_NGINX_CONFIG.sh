#!/bin/bash

# 🔧 TRADEAI Nginx Configuration Fix
# Fixes the invalid "must-revalidate" directive error

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
DOMAIN="tradeai.gonxt.tech"
NGINX_CONFIG="/etc/nginx/sites-available/tradeai"
NGINX_ENABLED="/etc/nginx/sites-enabled/tradeai"
SSL_DIR="/etc/letsencrypt/live/$DOMAIN"
BACKEND_PORT=3001
FRONTEND_PORT=3000
APP_DIR="/var/www/tradeai"

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
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root (use sudo)"
    exit 1
fi

log "🔧 Starting TRADEAI Nginx Configuration Fix"

# Remove existing broken config
step "Removing Broken Nginx Configuration"
rm -f "$NGINX_ENABLED" "$NGINX_CONFIG"

# Create corrected Nginx configuration
step "Creating Corrected Nginx Configuration for $DOMAIN"
cat > "$NGINX_CONFIG" << 'EOF'
server {
    listen 80;
    server_name tradeai.gonxt.tech www.tradeai.gonxt.tech;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tradeai.gonxt.tech www.tradeai.gonxt.tech;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/tradeai.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tradeai.gonxt.tech/privkey.pem;
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
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files
    location /static/ {
        alias /var/www/tradeai/frontend/build/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression (CORRECTED)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml+rss
        application/javascript
        application/json;
}
EOF

# Enable site
ln -sf "$NGINX_CONFIG" "$NGINX_ENABLED"

# Test Nginx configuration
step "Testing Nginx Configuration"
if nginx -t; then
    log "✅ Nginx configuration is valid"
else
    error "❌ Nginx configuration test failed"
    exit 1
fi

# Reload Nginx
step "Reloading Nginx"
systemctl reload nginx

log "🎉 Nginx configuration fix completed successfully!"
log "🌐 Configuration is now valid for $DOMAIN"
log "🔍 Test with: nginx -t"
log "📝 View config: cat $NGINX_CONFIG"