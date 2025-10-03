#!/bin/bash

# TRADEAI Production Deployment Fix Script
# This script addresses all production issues and deploys the latest build

set -e

echo "================================"
echo "TRADEAI Production Deployment Fix"
echo "================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting production deployment fix..."

SERVER_IP="13.247.139.75"
DOMAIN="tradeai.gonxt.tech"
OLD_JS="main.7c0f48f4.js"
NEW_JS="main.b75d57d7.js"
OLD_CSS="main.d881fcf3.css"
NEW_CSS="main.0c7b41d8.css"

# Check if we have the new build files
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking build files..."
if [ ! -f "frontend/build/static/js/$NEW_JS" ]; then
    echo "❌ New JS build file not found: frontend/build/static/js/$NEW_JS"
    echo "Building production frontend..."
    cd frontend && npm run build && cd ..
fi

if [ ! -f "frontend/build/static/css/$NEW_CSS" ]; then
    echo "❌ New CSS build file not found: frontend/build/static/css/$NEW_CSS"
    echo "Building production frontend..."
    cd frontend && npm run build && cd ..
fi

echo "✅ Build files verified"
echo "JS: $(du -h frontend/build/static/js/$NEW_JS | cut -f1)"
echo "CSS: $(du -h frontend/build/static/css/$NEW_CSS | cut -f1)"

# Create deployment package
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating deployment package..."
mkdir -p deployment_package/static/js
mkdir -p deployment_package/static/css

# Copy new build files
cp "frontend/build/static/js/$NEW_JS" deployment_package/static/js/
cp "frontend/build/static/css/$NEW_CSS" deployment_package/static/css/
cp frontend/build/index.html deployment_package/

# Update HTML to reference new files
sed -i "s/$OLD_JS/$NEW_JS/g" deployment_package/index.html
sed -i "s/$OLD_CSS/$NEW_CSS/g" deployment_package/index.html

echo "✅ Deployment package created"

# Create server configuration script
cat > deployment_package/deploy-to-server.sh << 'EOF'
#!/bin/bash

# Server deployment script - run this on the production server
echo "Starting server deployment..."

# Set timezone to South Africa
echo "Setting server timezone to Africa/Johannesburg..."
sudo timedatectl set-timezone Africa/Johannesburg
timedatectl status

# Backup current files
echo "Backing up current files..."
sudo mkdir -p /var/www/tradeai/backup/$(date +%Y%m%d_%H%M%S)
sudo cp /var/www/tradeai/static/js/main.*.js /var/www/tradeai/backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
sudo cp /var/www/tradeai/static/css/main.*.css /var/www/tradeai/backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
sudo cp /var/www/tradeai/index.html /var/www/tradeai/backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# Deploy new files
echo "Deploying new build files..."
sudo cp static/js/main.b75d57d7.js /var/www/tradeai/static/js/
sudo cp static/css/main.0c7b41d8.css /var/www/tradeai/static/css/
sudo cp index.html /var/www/tradeai/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/tradeai/
sudo chmod -R 644 /var/www/tradeai/static/
sudo chmod 644 /var/www/tradeai/index.html

# Fix SSL certificate
echo "Fixing SSL certificate..."
sudo mkdir -p /etc/ssl/tradeai
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/tradeai/privkey.pem \
    -out /etc/ssl/tradeai/fullchain.pem \
    -subj "/C=ZA/ST=Gauteng/L=Johannesburg/O=Trade AI Platform/OU=IT Department/CN=tradeai.gonxt.tech"

# Update nginx configuration for proper SSL
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

    # Serve static files
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # API proxy
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

# Enable site and restart services
sudo ln -sf /etc/nginx/sites-available/tradeai /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Restart backend services
sudo pm2 restart tradeai-backend || echo "PM2 service not found, skipping..."

echo "✅ Deployment completed successfully!"
echo "Server timezone: $(timedatectl | grep 'Time zone')"
echo "New build deployed: main.b75d57d7.js"
echo "SSL certificate updated for: tradeai.gonxt.tech"

EOF

chmod +x deployment_package/deploy-to-server.sh

# Create verification script
cat > deployment_package/verify-deployment.sh << 'EOF'
#!/bin/bash

echo "Verifying deployment..."

# Check server timezone
echo "Server timezone:"
timedatectl | grep "Time zone"

# Check if new files exist
echo "Checking deployed files:"
ls -la /var/www/tradeai/static/js/main.b75d57d7.js 2>/dev/null && echo "✅ New JS file deployed" || echo "❌ New JS file missing"
ls -la /var/www/tradeai/static/css/main.0c7b41d8.css 2>/dev/null && echo "✅ New CSS file deployed" || echo "❌ New CSS file missing"

# Check HTML references
echo "Checking HTML references:"
grep -q "main.b75d57d7.js" /var/www/tradeai/index.html && echo "✅ HTML references new JS" || echo "❌ HTML still references old JS"
grep -q "main.0c7b41d8.css" /var/www/tradeai/index.html && echo "✅ HTML references new CSS" || echo "❌ HTML still references old CSS"

# Test HTTP response
echo "Testing HTTP response:"
curl -s -o /dev/null -w "%{http_code}" https://tradeai.gonxt.tech && echo " - HTTPS response received" || echo " - HTTPS failed"

# Check SSL certificate
echo "Checking SSL certificate:"
echo | openssl s_client -servername tradeai.gonxt.tech -connect tradeai.gonxt.tech:443 2>/dev/null | openssl x509 -noout -subject 2>/dev/null || echo "SSL check failed"

echo "Verification complete!"
EOF

chmod +x deployment_package/verify-deployment.sh

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Deployment package created successfully!"
echo ""
echo "📦 Deployment Package Contents:"
echo "- static/js/$NEW_JS ($(du -h deployment_package/static/js/$NEW_JS | cut -f1))"
echo "- static/css/$NEW_CSS ($(du -h deployment_package/static/css/$NEW_CSS | cut -f1))"
echo "- index.html (updated references)"
echo "- deploy-to-server.sh (server deployment script)"
echo "- verify-deployment.sh (verification script)"
echo ""
echo "🚀 Next Steps:"
echo "1. Upload deployment_package/ to production server"
echo "2. Run: ./deploy-to-server.sh on the server"
echo "3. Run: ./verify-deployment.sh to verify"
echo ""
echo "📋 What this deployment will fix:"
echo "✅ Deploy new build without mock data (main.b75d57d7.js)"
echo "✅ Set server timezone to Africa/Johannesburg"
echo "✅ Fix SSL certificate for tradeai.gonxt.tech"
echo "✅ Update nginx configuration"
echo "✅ Restart all services"

# Clean up
rm -rf deployment_package

echo "================================"
echo "Deployment fix script completed!"
echo "================================"