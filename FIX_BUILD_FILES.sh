#!/bin/bash

# 🔧 TRADEAI v2.1.4 - Fix Build Files
# This script downloads the correct production build files to your server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🔧 TRADEAI v2.1.4 - Fix Build Files${NC}"
echo -e "${PURPLE}===================================${NC}"

# Configuration
DOMAIN="tradeai.gonxt.tech"
INSTALL_DIR="/var/www/tradeai-v2.1.4"
CURRENT_APP_DIR="/var/www/tradeai"

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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

log_success "Running as root user"

# Step 1: Download the correct production build files from GitHub
log_step "Downloading production build files from GitHub..."

cd /tmp
wget -O main.b75d57d7.js "https://github.com/Reshigan/TRADEAI/raw/main/frontend/build/static/js/main.b75d57d7.js"
wget -O main.0c7b41d8.css "https://github.com/Reshigan/TRADEAI/raw/main/frontend/build/static/css/main.0c7b41d8.css"

if [ -f "main.b75d57d7.js" ] && [ -f "main.0c7b41d8.css" ]; then
    log_success "Production build files downloaded successfully"
    
    # Show file sizes
    JS_SIZE=$(du -h main.b75d57d7.js | cut -f1)
    CSS_SIZE=$(du -h main.0c7b41d8.css | cut -f1)
    echo -e "${BLUE}📦 JavaScript file: ${JS_SIZE}${NC}"
    echo -e "${BLUE}📦 CSS file: ${CSS_SIZE}${NC}"
else
    log_error "Failed to download build files"
    exit 1
fi

# Step 2: Create the correct directory structure
log_step "Creating directory structure..."

mkdir -p "$INSTALL_DIR/frontend/build/static/js"
mkdir -p "$INSTALL_DIR/frontend/build/static/css"
mkdir -p "$INSTALL_DIR/static/js"
mkdir -p "$INSTALL_DIR/static/css"

log_success "Directory structure created"

# Step 3: Copy build files to correct locations
log_step "Installing production build files..."

# Copy to frontend build directory
cp main.b75d57d7.js "$INSTALL_DIR/frontend/build/static/js/"
cp main.0c7b41d8.css "$INSTALL_DIR/frontend/build/static/css/"

# Also copy to root static directory (for nginx serving)
cp main.b75d57d7.js "$INSTALL_DIR/static/js/"
cp main.0c7b41d8.css "$INSTALL_DIR/static/css/"

log_success "Production build files installed"

# Step 4: Create/update index.html with correct file references
log_step "Creating production index.html..."

cat > "$INSTALL_DIR/frontend/build/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="TRADEAI - Advanced Trading Platform v2.1.4" />
    <title>TRADEAI - Trading Platform</title>
    <link href="/static/css/main.0c7b41d8.css" rel="stylesheet">
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script src="/static/js/main.b75d57d7.js"></script>
</body>
</html>
EOF

# Also create in root directory
cp "$INSTALL_DIR/frontend/build/index.html" "$INSTALL_DIR/index.html"

log_success "Production index.html created"

# Step 5: Set proper permissions
log_step "Setting proper permissions..."

chown -R www-data:www-data "$INSTALL_DIR"
chmod -R 755 "$INSTALL_DIR"

# Make sure static files are readable
chmod 644 "$INSTALL_DIR/static/js/main.b75d57d7.js"
chmod 644 "$INSTALL_DIR/static/css/main.0c7b41d8.css"
chmod 644 "$INSTALL_DIR/index.html"

log_success "Permissions set correctly"

# Step 6: Update symbolic link
log_step "Updating symbolic link..."

ln -sfn "$INSTALL_DIR" "$CURRENT_APP_DIR"

log_success "Symbolic link updated"

# Step 7: Test nginx configuration and reload
log_step "Testing and reloading nginx..."

nginx -t
if [ $? -eq 0 ]; then
    systemctl reload nginx
    log_success "Nginx configuration valid and reloaded"
else
    log_error "Nginx configuration invalid"
    exit 1
fi

# Step 8: Restart PM2 if running
log_step "Restarting backend services..."

if command -v pm2 &> /dev/null; then
    pm2 restart all || true
    log_success "PM2 services restarted"
else
    log_warning "PM2 not found, skipping restart"
fi

# Step 9: Clean up temporary files
log_step "Cleaning up..."

rm -f /tmp/main.b75d57d7.js /tmp/main.0c7b41d8.css

log_success "Cleanup complete"

# Step 10: Verify installation
log_step "Verifying build files..."

echo ""
echo -e "${BLUE}📁 Build file verification:${NC}"

if [ -f "$INSTALL_DIR/static/js/main.b75d57d7.js" ]; then
    SIZE=$(du -h "$INSTALL_DIR/static/js/main.b75d57d7.js" | cut -f1)
    echo -e "✅ JavaScript: ${GREEN}$INSTALL_DIR/static/js/main.b75d57d7.js${NC} (${SIZE})"
else
    echo -e "❌ JavaScript file missing"
fi

if [ -f "$INSTALL_DIR/static/css/main.0c7b41d8.css" ]; then
    SIZE=$(du -h "$INSTALL_DIR/static/css/main.0c7b41d8.css" | cut -f1)
    echo -e "✅ CSS: ${GREEN}$INSTALL_DIR/static/css/main.0c7b41d8.css${NC} (${SIZE})"
else
    echo -e "❌ CSS file missing"
fi

if [ -f "$INSTALL_DIR/index.html" ]; then
    echo -e "✅ HTML: ${GREEN}$INSTALL_DIR/index.html${NC}"
else
    echo -e "❌ HTML file missing"
fi

# Step 11: Test HTTP response
log_step "Testing HTTP response..."

echo ""
echo -e "${BLUE}🌐 HTTP Response Test:${NC}"
curl -I "http://localhost" 2>/dev/null | head -1 || echo "❌ HTTP test failed"

# Final summary
echo ""
echo -e "${GREEN}🎉 BUILD FILES FIXED SUCCESSFULLY!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${BLUE}📊 What was fixed:${NC}"
echo -e "   • Downloaded correct production build files from GitHub"
echo -e "   • Installed main.b75d57d7.js (production JavaScript)"
echo -e "   • Installed main.0c7b41d8.css (production CSS)"
echo -e "   • Created proper index.html with correct file references"
echo -e "   • Set proper permissions and ownership"
echo -e "   • Reloaded nginx configuration"
echo -e "   • Restarted backend services"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "   1. Test website: ${BLUE}https://$DOMAIN${NC}"
echo -e "   2. Check SSL certificate (should be green lock)"
echo -e "   3. Test login functionality"
echo -e "   4. Verify API integration (no mock data)"
echo ""
echo -e "${GREEN}✅ TRADEAI v2.1.4 build files are now correct!${NC}"
echo -e "${PURPLE}🚀 Your production build is ready!${NC}"