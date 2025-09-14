#!/bin/bash

# 🔧 TRADEAI Frontend Rebuild Script
# This script rebuilds the frontend from source instead of downloading build files
# Resolves all build file 404 issues by creating fresh production build

set -e  # Exit on any error

echo "🔧 TRADEAI Frontend Rebuild Script"
echo "=================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

echo "✅ Running as root user"

# Define paths
REPO_DIR="/tmp/tradeai-rebuild"
WEB_DIR="/var/www/tradeai"
BACKEND_DIR="/var/www/tradeai-backend"

# Clean up any existing temp directory
echo "🔄 Cleaning up temporary directories..."
rm -rf "$REPO_DIR"

# Clone the repository
echo "🔄 Cloning TRADEAI repository..."
git clone https://github.com/Reshigan/TRADEAI.git "$REPO_DIR"
cd "$REPO_DIR"

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "🔄 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Install npm if not present
if ! command -v npm &> /dev/null; then
    echo "🔄 Installing npm..."
    apt-get install -y npm
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Navigate to frontend directory
cd "$REPO_DIR/frontend"

# Install dependencies
echo "🔄 Installing frontend dependencies..."
npm install --legacy-peer-deps

# Build the frontend
echo "🔄 Building production frontend..."
npm run build

# Verify build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed - no build directory created"
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    echo "❌ Build failed - no index.html created"
    exit 1
fi

echo "✅ Frontend build completed successfully"

# Create web directory if it doesn't exist
echo "🔄 Creating web directory structure..."
mkdir -p "$WEB_DIR"

# Stop nginx temporarily
echo "🔄 Stopping nginx temporarily..."
systemctl stop nginx || true

# Backup existing files
if [ -d "$WEB_DIR" ]; then
    echo "🔄 Backing up existing web files..."
    mv "$WEB_DIR" "${WEB_DIR}.backup.$(date +%Y%m%d_%H%M%S)" || true
fi

# Copy build files to web directory
echo "🔄 Installing new build files..."
cp -r "$REPO_DIR/frontend/build" "$WEB_DIR"

# Set proper permissions
echo "🔄 Setting proper permissions..."
chown -R www-data:www-data "$WEB_DIR"
chmod -R 755 "$WEB_DIR"

# Create nginx configuration (force recreate to fix any issues)
NGINX_CONFIG="/etc/nginx/sites-available/tradeai"
echo "🔄 Creating fresh nginx configuration..."
# Remove any existing problematic configurations
rm -f /etc/nginx/sites-enabled/tradeai
rm -f /etc/nginx/sites-available/tradeai

# Check if SSL certificates exist
SSL_CERT_PATH="/etc/letsencrypt/live/tradeai.gonxt.tech/fullchain.pem"
SSL_KEY_PATH="/etc/letsencrypt/live/tradeai.gonxt.tech/privkey.pem"

if [[ -f "$SSL_CERT_PATH" && -f "$SSL_KEY_PATH" ]]; then
    echo "🔒 SSL certificates found - creating HTTPS configuration..."
    cat > "$NGINX_CONFIG" << 'EOF'
server {
    listen 80;
    server_name tradeai.gonxt.tech;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tradeai.gonxt.tech;

    ssl_certificate /etc/letsencrypt/live/tradeai.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tradeai.gonxt.tech/privkey.pem;

    root /var/www/tradeai;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

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
}
EOF
else
    echo "⚠️  SSL certificates not found - creating HTTP-only configuration..."
    echo "   Run 'sudo certbot --nginx -d tradeai.gonxt.tech' after this script to enable HTTPS"
    cat > "$NGINX_CONFIG" << 'EOF'
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
fi

# Enable the site
ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/

# Clean up any temporary nginx files
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default

# Test nginx configuration
echo "🔄 Testing nginx configuration..."
nginx -t

# Start nginx
echo "🔄 Starting nginx..."
systemctl start nginx
systemctl enable nginx

# Setup backend if not already running
if [ -d "$REPO_DIR/backend" ]; then
    echo "🔄 Setting up backend..."
    
    # Create backend directory
    mkdir -p "$BACKEND_DIR"
    
    # Copy backend files
    cp -r "$REPO_DIR/backend"/* "$BACKEND_DIR/"
    
    # Install Node.js dependencies
    if [ -f "$BACKEND_DIR/package.json" ]; then
        echo "🔄 Installing Node.js dependencies..."
        cd "$BACKEND_DIR"
        npm install --production || true
    fi
    
    # Install PM2 if not present
    if ! command -v pm2 &> /dev/null; then
        echo "🔄 Installing PM2..."
        npm install -g pm2
    fi
    
    # Start backend with PM2
    cd "$BACKEND_DIR"
    pm2 delete tradeai-backend || true
    pm2 start src/server.js --name tradeai-backend
    pm2 save
    pm2 startup
fi

# Clean up
echo "🔄 Cleaning up temporary files..."
rm -rf "$REPO_DIR"

# Final verification
echo "🔄 Verifying installation..."

# Check if files exist
if [ -f "$WEB_DIR/index.html" ]; then
    echo "✅ index.html installed"
else
    echo "❌ index.html missing"
    exit 1
fi

# Check if static files exist
if [ -d "$WEB_DIR/static" ]; then
    echo "✅ Static files directory exists"
    JS_FILES=$(find "$WEB_DIR/static/js" -name "*.js" | wc -l)
    CSS_FILES=$(find "$WEB_DIR/static/css" -name "*.css" | wc -l)
    echo "✅ Found $JS_FILES JavaScript files"
    echo "✅ Found $CSS_FILES CSS files"
else
    echo "❌ Static files directory missing"
    exit 1
fi

# Check nginx status
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    exit 1
fi

# Check PM2 status
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 list | grep tradeai-backend | grep online || echo "")
    if [ -n "$PM2_STATUS" ]; then
        echo "✅ Backend is running"
    else
        echo "⚠️  Backend may not be running (check with: pm2 status)"
    fi
fi

echo ""
echo "🎉 FRONTEND REBUILD COMPLETED SUCCESSFULLY!"
echo ""
echo "✅ What was accomplished:"
echo "   • Fresh frontend build from source code"
echo "   • Production-optimized JavaScript and CSS"
echo "   • Proper file permissions and ownership"
echo "   • Nginx configuration and restart"
echo "   • Backend setup and PM2 process management"
echo ""
echo "🌐 Your website should now be available at:"
if [[ -f "$SSL_CERT_PATH" && -f "$SSL_KEY_PATH" ]]; then
    echo "   https://tradeai.gonxt.tech (HTTPS enabled)"
else
    echo "   http://tradeai.gonxt.tech (HTTP only - SSL setup needed)"
fi
echo ""
echo "🔍 To verify everything is working:"
echo "   • Visit the website in your browser"
if [[ -f "$SSL_CERT_PATH" && -f "$SSL_KEY_PATH" ]]; then
    echo "   • Check for SSL certificate (green lock)"
else
    echo "   • Set up SSL certificate (see instructions below)"
fi
echo "   • Test login functionality"
echo "   • Verify API responses"
echo ""
echo "📊 System Status:"
echo "   • Nginx: $(systemctl is-active nginx)"
echo "   • PM2 Backend: $(pm2 list 2>/dev/null | grep tradeai-backend | awk '{print $10}' || echo 'Not found')"
echo ""
echo "🎯 If you encounter any issues:"
echo "   • Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   • Check PM2 logs: pm2 logs tradeai-backend"
echo "   • Restart services: sudo systemctl restart nginx && pm2 restart tradeai-backend"
echo ""

# Add SSL setup instructions if certificates don't exist
if [[ ! -f "$SSL_CERT_PATH" || ! -f "$SSL_KEY_PATH" ]]; then
    echo "🔒 SSL CERTIFICATE SETUP REQUIRED:"
    echo ""
    echo "Your site is currently running on HTTP only. To enable HTTPS:"
    echo ""
    echo "1. Install Certbot (if not already installed):"
    echo "   sudo apt update"
    echo "   sudo apt install certbot python3-certbot-nginx -y"
    echo ""
    echo "2. Generate SSL certificate:"
    echo "   sudo certbot --nginx -d tradeai.gonxt.tech"
    echo ""
    echo "3. Verify auto-renewal:"
    echo "   sudo certbot renew --dry-run"
    echo ""
    echo "4. After SSL setup, run this script again to enable HTTPS redirect:"
    echo "   sudo ./REBUILD_FRONTEND.sh"
    echo ""
    echo "⚠️  Make sure your domain tradeai.gonxt.tech points to this server's IP address"
    echo "   before running certbot, or the certificate generation will fail."
    echo ""
fi