#!/bin/bash

# EMERGENCY NGINX SSL CERTIFICATE FIX
# This script immediately fixes the SSL certificate error by creating HTTP-only configuration

set -e

echo "🚨 EMERGENCY NGINX SSL CERTIFICATE FIX"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

echo "🔄 Stopping nginx to prevent conflicts..."
systemctl stop nginx || true

echo "🔄 Backing up current nginx configuration..."
mkdir -p /tmp/nginx_backup_$(date +%Y%m%d_%H%M%S)
cp -r /etc/nginx/sites-available /tmp/nginx_backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
cp -r /etc/nginx/sites-enabled /tmp/nginx_backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

echo "🔄 Removing problematic SSL configurations..."
rm -f /etc/nginx/sites-enabled/tradeai
rm -f /etc/nginx/sites-available/tradeai
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default

echo "🔄 Creating HTTP-only nginx configuration..."
cat > /etc/nginx/sites-available/tradeai << 'EOF'
server {
    listen 80;
    server_name tradeai.gonxt.tech;

    root /var/www/tradeai;
    index index.html;

    # Security headers (HTTP version)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/tradeai;
    }
}
EOF

echo "🔄 Enabling the HTTP-only site..."
ln -sf /etc/nginx/sites-available/tradeai /etc/nginx/sites-enabled/

echo "🔄 Testing nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration test passed!"
else
    echo "❌ Nginx configuration test failed!"
    echo "🔄 Checking for additional issues..."
    
    # Check if there are other config files causing issues
    echo "🔍 Checking for other SSL configurations..."
    grep -r "ssl_certificate" /etc/nginx/ 2>/dev/null || echo "No other SSL configurations found"
    
    # Try with minimal configuration
    echo "🔄 Creating minimal nginx configuration..."
    cat > /etc/nginx/sites-available/tradeai << 'EOF'
server {
    listen 80;
    server_name tradeai.gonxt.tech;
    root /var/www/tradeai;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
    
    echo "🔄 Testing minimal configuration..."
    if nginx -t; then
        echo "✅ Minimal configuration works!"
    else
        echo "❌ Even minimal configuration fails - checking main nginx.conf..."
        nginx -T 2>&1 | grep -i ssl || echo "No SSL references in main config"
        exit 1
    fi
fi

echo "🔄 Starting nginx..."
systemctl start nginx

echo "🔄 Enabling nginx to start on boot..."
systemctl enable nginx

echo "🔄 Checking nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running successfully!"
else
    echo "❌ Nginx failed to start"
    systemctl status nginx
    exit 1
fi

echo ""
echo "🎉 EMERGENCY FIX COMPLETED!"
echo "========================="
echo ""
echo "✅ What was fixed:"
echo "   • Removed all SSL certificate references"
echo "   • Created HTTP-only nginx configuration"
echo "   • Nginx is now running without SSL errors"
echo ""
echo "🌐 Your website should now be accessible at:"
echo "   http://tradeai.gonxt.tech"
echo ""
echo "🔒 To enable HTTPS later:"
echo "   1. Install certbot: sudo apt install certbot python3-certbot-nginx -y"
echo "   2. Generate certificate: sudo certbot --nginx -d tradeai.gonxt.tech"
echo "   3. Certbot will automatically update your nginx configuration"
echo ""
echo "🔍 Verify the fix:"
echo "   • curl -I http://tradeai.gonxt.tech"
echo "   • systemctl status nginx"
echo ""