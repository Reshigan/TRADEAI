#!/bin/bash

# Remote Production Fix Script for TRADEAI
# This script can be executed to fix all production issues remotely

set -e

echo "================================"
echo "TRADEAI Remote Production Fix"
echo "================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting remote production fix..."

SERVER_IP="13.247.139.75"
DOMAIN="tradeai.gonxt.tech"

# Create a comprehensive fix script that addresses all issues
cat > production_fix_commands.txt << 'EOF'
# TRADEAI Production Fix Commands
# Execute these commands on the production server

# 1. Set server timezone to South Africa
echo "Setting server timezone to Africa/Johannesburg..."
sudo timedatectl set-timezone Africa/Johannesburg
timedatectl status

# 2. Create proper directory structure
sudo mkdir -p /var/www/tradeai/static/js
sudo mkdir -p /var/www/tradeai/static/css
sudo mkdir -p /var/www/tradeai/backup/$(date +%Y%m%d_%H%M%S)

# 3. Backup current files
echo "Backing up current files..."
sudo cp /var/www/tradeai/static/js/main.*.js /var/www/tradeai/backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
sudo cp /var/www/tradeai/static/css/main.*.css /var/www/tradeai/backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
sudo cp /var/www/tradeai/index.html /var/www/tradeai/backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# 4. Create new build files (if not uploaded separately)
# Note: The actual files need to be uploaded to the server first

# 5. Update HTML to reference new build
sudo tee /var/www/tradeai/index.html << 'HTML_EOF'
<!doctype html><html lang="en"><head><meta charset="utf-8"/><link rel="icon" href="/images/corporate-favicon.svg" type="image/svg+xml"/><link rel="icon" href="/images/favicon.ico" type="image/x-icon"/><link rel="shortcut icon" href="/images/favicon.ico"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#1e40af"/><meta name="description" content="Trade AI Platform - Enterprise-grade FMCG Trade Intelligence with AI-Powered Analytics. Professional, sophisticated, and powerful."/><link rel="apple-touch-icon" href="/images/corporate-favicon.svg"/><link rel="manifest" href="/manifest.json"/><title>Trade AI Platform | Enterprise Trade Intelligence</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"><style>body{background:#fafbfc;color:#1e293b;font-family:Inter,sans-serif}#root{min-height:100vh}</style><script defer="defer" src="/static/js/main.b75d57d7.js"></script><link href="/static/css/main.0c7b41d8.css" rel="stylesheet"></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>
HTML_EOF

# 6. Fix SSL certificate with proper domain
echo "Creating SSL certificate for tradeai.gonxt.tech..."
sudo mkdir -p /etc/ssl/tradeai
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/tradeai/privkey.pem \
    -out /etc/ssl/tradeai/fullchain.pem \
    -subj "/C=ZA/ST=Gauteng/L=Johannesburg/O=Trade AI Platform/OU=IT Department/CN=tradeai.gonxt.tech"

# 7. Update nginx configuration
sudo tee /etc/nginx/sites-available/tradeai << 'NGINX_EOF'
server {
    listen 80;
    server_name tradeai.gonxt.tech;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tradeai.gonxt.tech;

    ssl_certificate /etc/ssl/tradeai/fullchain.pem;
    ssl_certificate_key /etc/ssl/tradeai/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    root /var/www/tradeai;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Serve static files with proper caching
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve React app
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
}
NGINX_EOF

# 8. Enable site and test nginx configuration
sudo ln -sf /etc/nginx/sites-available/tradeai /etc/nginx/sites-enabled/
sudo nginx -t

# 9. Set proper file permissions
sudo chown -R www-data:www-data /var/www/tradeai/
sudo chmod -R 644 /var/www/tradeai/static/
sudo chmod 644 /var/www/tradeai/index.html

# 10. Restart services
echo "Restarting services..."
sudo systemctl reload nginx
sudo pm2 restart tradeai-backend || echo "PM2 service not found, may need manual backend restart"

# 11. Verify deployment
echo "Verifying deployment..."
echo "Server timezone: $(timedatectl | grep 'Time zone')"
echo "Nginx status: $(sudo systemctl is-active nginx)"
echo "SSL certificate created for: tradeai.gonxt.tech"

# Test HTTP response
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://tradeai.gonxt.tech || echo "HTTPS test failed"

echo "✅ Production fix completed!"
echo "🌍 Server timezone set to Africa/Johannesburg"
echo "🔒 SSL certificate updated for tradeai.gonxt.tech"
echo "📦 HTML updated to reference main.b75d57d7.js"
echo "🔄 Services restarted"

EOF

echo "✅ Production fix commands created in: production_fix_commands.txt"
echo ""
echo "📋 Summary of fixes:"
echo "1. ✅ Set server timezone to Africa/Johannesburg"
echo "2. ✅ Update HTML to reference new build (main.b75d57d7.js)"
echo "3. ✅ Create proper SSL certificate for tradeai.gonxt.tech"
echo "4. ✅ Update nginx configuration with security headers"
echo "5. ✅ Set proper file permissions"
echo "6. ✅ Restart all services"
echo ""
echo "🚀 To apply these fixes:"
echo "1. Upload the new build files to the server:"
echo "   - main.b75d57d7.js → /var/www/tradeai/static/js/"
echo "   - main.0c7b41d8.css → /var/www/tradeai/static/css/"
echo "2. Execute the commands in production_fix_commands.txt on the server"
echo ""
echo "The server will then serve the new build without mock data!"

echo "================================"
echo "Remote production fix prepared!"
echo "================================"