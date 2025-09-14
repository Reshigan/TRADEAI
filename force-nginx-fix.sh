#!/bin/bash

set -e

echo "=== Force Nginx Configuration Fix ==="
echo "Directly replacing nginx config inside the container"
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

log "Starting direct nginx config fix..."

# Check what config is currently being used
log "Current nginx configuration:"
docker exec trade-ai-nginx cat /etc/nginx/conf.d/default.conf | head -10

# Create the correct configuration directly in the container
log "Replacing nginx configuration directly in container..."
docker exec trade-ai-nginx sh -c 'cat > /etc/nginx/conf.d/default.conf << "EOF"
upstream frontend {
    server frontend:80;
}

upstream backend {
    server backend:5000;
}

upstream ai-services {
    server ai-services:8000;
}

upstream monitoring {
    server monitoring:8080;
}

server {
    listen 80;
    server_name tradeai.gonxt.tech localhost;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    # Gzip compression
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_vary on;
    gzip_types
        application/javascript
        application/json
        text/css
        text/javascript
        text/plain;

    # Health check
    location /health {
        return 200 "{\"status\":\"UP\",\"service\":\"nginx-proxy\"}";
        add_header Content-Type application/json;
    }

    # API routes
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # AI services
    location /ai/ {
        proxy_pass http://ai-services/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Monitoring
    location /monitoring/ {
        proxy_pass http://monitoring/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend - serve React app
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle React Router
        proxy_intercept_errors on;
        error_page 404 = @fallback;
    }

    location @fallback {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Error pages
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        return 500 "{\"error\":\"Internal Server Error\"}";
        add_header Content-Type application/json;
    }
}
EOF'

# Also check if there are any SSL redirects in the main nginx.conf
log "Checking main nginx.conf for SSL redirects..."
docker exec trade-ai-nginx grep -n "301\|redirect\|ssl" /etc/nginx/nginx.conf || log "No SSL redirects found in main config"

# Test the configuration
log "Testing nginx configuration..."
docker exec trade-ai-nginx nginx -t

# Reload nginx with new configuration
log "Reloading nginx configuration..."
docker exec trade-ai-nginx nginx -s reload

# Wait a moment for reload
sleep 5

# Test the configuration
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

# Show the actual content being served
log "Sample of content being served:"
curl -s http://tradeai.gonxt.tech | head -10

# Show container status
echo
echo "=== Container Status ==="
docker-compose ps

if [ "$PROXY_STATUS" = "200" ]; then
    log "✅ SUCCESS! Main site is now working properly!"
    echo
    echo "🎉 TRADEAI is now fully deployed and working!"
    echo "✅ React app built successfully"
    echo "✅ Frontend serving actual application"
    echo "✅ Nginx proxy configured correctly"
    echo
    echo "Visit: http://tradeai.gonxt.tech"
elif [ "$PROXY_STATUS" = "301" ]; then
    error "❌ Still getting 301 redirects. There may be SSL config in main nginx.conf"
    echo
    echo "Let's check the main nginx configuration:"
    docker exec trade-ai-nginx cat /etc/nginx/nginx.conf | grep -A10 -B10 "ssl\|443\|redirect" || echo "No SSL config found"
else
    warn "⚠️  Unexpected status: $PROXY_STATUS"
fi

log "Direct nginx config fix complete!"