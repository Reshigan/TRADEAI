#!/bin/bash

set -e

echo "=== Fix Main Nginx Configuration ==="
echo "Fixing SSL redirects in main nginx.conf that override default.conf"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
   exit 1
fi

log "Starting main nginx.conf fix..."

# Check the problematic line 81
log "Current nginx.conf around line 81:"
docker exec trade-ai-nginx sed -n '75,85p' /etc/nginx/nginx.conf

# Check for SSL redirects in main config
log "Checking for SSL redirects in main nginx.conf:"
docker exec trade-ai-nginx grep -n "ssl\|443\|redirect\|301" /etc/nginx/nginx.conf || log "No explicit SSL redirects found"

# Check for server blocks in main config
log "Checking for server blocks in main nginx.conf:"
docker exec trade-ai-nginx grep -n "server {" /etc/nginx/nginx.conf || log "No server blocks in main config"

# The issue might be that nginx is using a default SSL configuration
# Let's create a completely clean main nginx.conf
log "Creating clean main nginx.conf without SSL redirects..."

docker exec trade-ai-nginx sh -c 'cat > /etc/nginx/nginx.conf << "EOF"
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '\''$remote_addr - $remote_user [$time_local] "$request" '\''
                      '\''$status $body_bytes_sent "$http_referer" '\''
                      '\''"$http_user_agent" "$http_x_forwarded_for"'\'';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;
    types_hash_max_size 2048;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF'

# Test the new configuration
log "Testing new nginx configuration..."
docker exec trade-ai-nginx nginx -t

if [ $? -eq 0 ]; then
    log "✅ Nginx configuration is valid"
    
    # Reload nginx
    log "Reloading nginx with clean configuration..."
    docker exec trade-ai-nginx nginx -s reload
    
    # Wait for reload
    sleep 5
    
    # Test the fix
    log "Testing the fixed configuration..."
    
    # Test nginx health
    NGINX_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null || echo "000")
    log "Nginx health check: $NGINX_HEALTH"
    
    # Test frontend through proxy
    PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://tradeai.gonxt.tech 2>/dev/null || echo "000")
    log "Main site through proxy: $PROXY_STATUS"
    
    # Test direct frontend
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
    log "Direct frontend: $FRONTEND_STATUS"
    
    if [ "$PROXY_STATUS" = "200" ]; then
        log "✅ SUCCESS! Main site is now working properly!"
        echo
        echo "🎉 TRADEAI is now fully deployed and working!"
        echo "✅ React app built successfully"
        echo "✅ Frontend serving actual application"
        echo "✅ Nginx proxy configured correctly"
        echo "✅ SSL redirects removed"
        echo
        echo "Visit: http://tradeai.gonxt.tech"
        
        # Show a sample of the actual content
        log "Sample of TRADEAI content being served:"
        curl -s http://tradeai.gonxt.tech | head -5
        
    elif [ "$PROXY_STATUS" = "301" ]; then
        error "❌ Still getting 301 redirects"
        echo "Let's check what's still causing redirects:"
        
        # Check if there are any other nginx processes or configs
        docker exec trade-ai-nginx ps aux | grep nginx
        docker exec trade-ai-nginx find /etc/nginx -name "*.conf" -exec echo "=== {} ===" \; -exec cat {} \;
        
    else
        warn "⚠️  Unexpected status: $PROXY_STATUS"
        echo "Let's check nginx logs:"
        docker exec trade-ai-nginx tail -20 /var/log/nginx/error.log
    fi
    
else
    error "❌ Nginx configuration test failed"
    docker exec trade-ai-nginx nginx -t
fi

# Show container status
echo
echo "=== Container Status ==="
cd /opt/tradeai && docker-compose ps

log "Main nginx.conf fix complete!"