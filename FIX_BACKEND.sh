#!/bin/bash

# BACKEND FIX SCRIPT
# This script fixes the backend deployment issue by properly starting the Node.js backend

set -e

echo "🔧 BACKEND FIX SCRIPT"
echo "===================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# Variables
BACKEND_DIR="/var/www/tradeai-backend"
REPO_DIR="/tmp/tradeai-repo"

echo "🔄 Stopping any existing backend processes..."
pm2 delete tradeai-backend || true
pm2 kill || true

echo "🔄 Checking if backend directory exists..."
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found at $BACKEND_DIR"
    echo "🔄 Cloning repository to get backend files..."
    
    # Clone the repository
    rm -rf "$REPO_DIR"
    git clone https://github.com/Reshigan/TRADEAI.git "$REPO_DIR"
    
    # Create backend directory and copy files
    mkdir -p "$BACKEND_DIR"
    cp -r "$REPO_DIR/backend"/* "$BACKEND_DIR/"
    
    echo "✅ Backend files copied to $BACKEND_DIR"
fi

echo "🔄 Navigating to backend directory..."
cd "$BACKEND_DIR"

echo "🔄 Checking for package.json..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in $BACKEND_DIR"
    echo "🔍 Contents of backend directory:"
    ls -la
    exit 1
fi

echo "🔄 Installing Node.js dependencies..."
npm install --production

echo "🔄 Checking for main server file..."
if [ ! -f "src/server.js" ]; then
    echo "❌ src/server.js not found"
    echo "🔍 Looking for alternative entry points..."
    find . -name "*.js" -path "./src/*" | head -5
    
    if [ -f "src/app.js" ]; then
        echo "✅ Found src/app.js, using as entry point"
        ENTRY_POINT="src/app.js"
    else
        echo "❌ No suitable entry point found"
        exit 1
    fi
else
    echo "✅ Found src/server.js"
    ENTRY_POINT="src/server.js"
fi

echo "🔄 Installing PM2 if not present..."
if ! command -v pm2 &> /dev/null; then
    echo "🔄 Installing PM2..."
    npm install -g pm2
fi

echo "🔄 Starting backend with PM2..."
pm2 start "$ENTRY_POINT" --name tradeai-backend

echo "🔄 Saving PM2 configuration..."
pm2 save

echo "🔄 Setting up PM2 startup..."
pm2 startup || true

echo "🔄 Checking backend status..."
pm2 status

echo ""
echo "🎉 BACKEND FIX COMPLETED!"
echo "======================="
echo ""
echo "✅ What was fixed:"
echo "   • Stopped any existing backend processes"
echo "   • Installed Node.js dependencies"
echo "   • Started backend with correct entry point ($ENTRY_POINT)"
echo "   • Configured PM2 for automatic startup"
echo ""
echo "🔍 Verify the fix:"
echo "   • pm2 status"
echo "   • pm2 logs tradeai-backend"
echo "   • curl http://localhost:5000/api/health (if health endpoint exists)"
echo ""
echo "🌐 Your backend should now be running on port 5000"
echo ""