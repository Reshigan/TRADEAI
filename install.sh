#!/bin/bash

# TRADEAI One-Line Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/Reshigan/TRADEAI/main/install.sh | bash

set -e

echo "🚀 TRADEAI One-Line Installer"
echo "============================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed. Please log out and back in, then run this script again."
    exit 0
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Clean up any existing installation
echo "🧹 Cleaning up existing installation..."
if [ -d "TRADEAI" ]; then
    cd TRADEAI
    if [ -f "docker-compose.simple.yml" ]; then
        docker-compose -f docker-compose.simple.yml down --volumes --remove-orphans 2>/dev/null || true
    fi
    cd ..
    rm -rf TRADEAI
fi

# Clone repository
echo "📥 Cloning TRADEAI repository..."
git clone https://github.com/Reshigan/TRADEAI.git
cd TRADEAI

# Run deployment
echo "🚀 Starting deployment..."
./deploy.sh

echo ""
echo "🎉 TRADEAI Installation Complete!"
echo "================================="
echo ""
echo "🌐 Your platform is ready at: http://localhost:3000"
echo "🔐 Login with: admin@tradeai.com / admin123"
echo ""
echo "📋 Next steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Login with the default credentials"
echo "   3. Change the default password"
echo "   4. Start using your TRADEAI platform!"
echo ""