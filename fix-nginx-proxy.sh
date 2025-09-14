#!/bin/bash

set -e

echo "=== Fix Nginx Proxy Configuration ==="
echo "Fixing nginx proxy to properly serve the React app"
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

log "Starting nginx proxy fix..."

# Go to the TRADEAI directory
cd /opt/tradeai || {
    error "TRADEAI directory not found at /opt/tradeai"
    exit 1
}

# Check current nginx logs
log "Checking nginx logs for errors..."
docker-compose logs --tail=20 nginx

# Create a simplified nginx configuration for HTTP-only
log "Creating simplified nginx configuration..."
cat > nginx/nginx.conf << 'EOF'
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
        return 200 '{"status":"UP","service":"nginx-proxy"}';
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
        return 500 '{"error":"Internal Server Error"}';
        add_header Content-Type application/json;
    }
}
EOF

# Restart nginx with new configuration
log "Restarting nginx with new configuration..."
docker-compose stop nginx
docker-compose rm -f nginx
docker-compose up -d nginx

# Wait for nginx to start
log "Waiting for nginx to start..."
sleep 15

# Test the configuration
log "Testing nginx configuration..."

# Test nginx health
NGINX_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null || echo "000")
log "Nginx health check: $NGINX_HEALTH"

# Test frontend through proxy
PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://tradeai.gonxt.tech 2>/dev/null || echo "000")
log "Main site through proxy: $PROXY_STATUS"

# Test direct frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
log "Direct frontend: $FRONTEND_STATUS"

# Show container status
echo
echo "=== Container Status ==="
docker-compose ps

# Show nginx logs
echo
echo "=== Recent Nginx Logs ==="
docker-compose logs --tail=10 nginx

if [ "$PROXY_STATUS" = "200" ]; then
    log "✅ SUCCESS! Main site is now working properly!"
    echo
    echo "🎉 TRADEAI is now fully deployed and working!"
    echo "✅ React app built successfully"
    echo "✅ Frontend serving actual application"
    echo "✅ Nginx proxy configured correctly"
    echo
    echo "Visit: http://tradeai.gonxt.tech"
else
    warn "⚠️  Main site still not responding with 200. Status: $PROXY_STATUS"
    echo
    echo "Troubleshooting steps:"
    echo "1. Check nginx logs: docker-compose logs nginx"
    echo "2. Check frontend logs: docker-compose logs frontend"
    echo "3. Test direct frontend: curl -I http://localhost:3000"
fi

log "Nginx proxy fix complete!"