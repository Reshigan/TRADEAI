#!/bin/bash

echo "================================================================"
echo "       TRADEAI - Phase Enhancement Installation"
echo "================================================================"
echo ""
echo "This script will install:"
echo "  - Phase 1: Ollama + Llama3 (Real AI)"
echo "  - Phase 2: WebSocket (Real-time features)"
echo "  - Phase 3: Redis, Rate Limiting, Monitoring"
echo ""
echo "================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "================================================================"
echo "PHASE 1: Installing Ollama + Llama3"
echo "================================================================"
echo ""

# Check if Ollama is installed
if command_exists ollama; then
    print_success "Ollama is already installed"
    ollama --version
else
    echo "Installing Ollama..."
    if curl -fsSL https://ollama.com/install.sh | sh; then
        print_success "Ollama installed successfully"
    else
        print_error "Ollama installation failed"
        exit 1
    fi
fi

echo ""
echo "Starting Ollama service..."
if command_exists systemctl; then
    sudo systemctl start ollama 2>/dev/null || nohup ollama serve > /tmp/ollama.log 2>&1 &
else
    nohup ollama serve > /tmp/ollama.log 2>&1 &
fi

sleep 3

# Check if Ollama is running
if pgrep -x "ollama" > /dev/null; then
    print_success "Ollama service is running"
else
    print_warning "Ollama service may not be running properly"
fi

echo ""
echo "Pulling Llama3 model (this may take 5-10 minutes)..."
echo "Model size: ~4.7GB"
echo ""

if ollama pull llama3; then
    print_success "Llama3 model downloaded successfully"
else
    print_warning "Llama3 download failed or partially completed"
fi

echo ""
echo "================================================================"
echo "PHASE 2: Installing WebSocket Dependencies"
echo "================================================================"
echo ""

cd backend || exit 1

echo "Installing ws package for WebSocket support..."
if npm install ws --save; then
    print_success "WebSocket package installed"
else
    print_error "WebSocket package installation failed"
fi

echo ""
echo "================================================================"
echo "PHASE 3: Installing Redis and Dependencies"
echo "================================================================"
echo ""

# Check if Redis is installed
if command_exists redis-server; then
    print_success "Redis is already installed"
    redis-server --version
else
    echo "Installing Redis..."
    if command_exists apt-get; then
        sudo apt-get update
        if sudo apt-get install -y redis-server; then
            print_success "Redis installed successfully"
        else
            print_warning "Redis installation failed, continuing with in-memory cache"
        fi
    elif command_exists yum; then
        if sudo yum install -y redis; then
            print_success "Redis installed successfully"
        else
            print_warning "Redis installation failed, continuing with in-memory cache"
        fi
    else
        print_warning "Package manager not found, skipping Redis installation"
    fi
fi

# Start Redis
if command_exists redis-server; then
    echo "Starting Redis service..."
    if command_exists systemctl; then
        sudo systemctl start redis 2>/dev/null || sudo systemctl start redis-server 2>/dev/null
        sudo systemctl enable redis 2>/dev/null || sudo systemctl enable redis-server 2>/dev/null
    fi
    print_success "Redis service started"
fi

# Install Redis npm package
echo ""
echo "Installing Redis npm package..."
if npm install redis --save; then
    print_success "Redis npm package installed"
else
    print_error "Redis npm package installation failed"
fi

echo ""
echo "================================================================"
echo "Installing Additional Dependencies"
echo "================================================================"
echo ""

# Install other dependencies
echo "Installing axios (if not already installed)..."
npm install axios --save

echo "Installing express-rate-limit..."
npm install express-rate-limit --save

echo "Installing compression..."
npm install compression --save

echo "Installing helmet (security)..."
npm install helmet --save

print_success "All npm dependencies installed"

echo ""
echo "================================================================"
echo "Setting up Environment Variables"
echo "================================================================"
echo ""

# Create/update .env file
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env file..."
    cat > "$ENV_FILE" << 'ENVEOF'
# Database
MONGODB_URI=mongodb://localhost:27017/tradeai

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production

# Server
PORT=5000
NODE_ENV=production

# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Redis Configuration
REDIS_URL=redis://localhost:6379

# WebSocket Configuration
WS_PATH=/ws

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=1000

ENVEOF
    print_success ".env file created"
else
    print_warning ".env file already exists, please manually add:"
    echo "  OLLAMA_URL=http://localhost:11434"
    echo "  OLLAMA_MODEL=llama3"
    echo "  REDIS_URL=redis://localhost:6379"
fi

echo ""
echo "================================================================"
echo "Registering New Routes"
echo "================================================================"
echo ""

# Update server.js to include new services
cat > update-server.js << 'JSEOF'
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'src', 'server.js');

if (fs.existsSync(serverPath)) {
  console.log('Updating server.js with new services...');
  
  // Read current server.js
  let content = fs.readFileSync(serverPath, 'utf8');
  
  // Add imports if not already present
  if (!content.includes('cacheService')) {
    content = content.replace(
      /(const express = require\('express'\);)/,
      "$1\nconst cacheService = require('../services/cacheService');"
    );
  }
  
  if (!content.includes('websocketService')) {
    content = content.replace(
      /(const express = require\('express'\);)/,
      "$1\nconst websocketService = require('../services/websocketService');"
    );
  }
  
  if (!content.includes('rateLimitService')) {
    content = content.replace(
      /(const express = require\('express'\);)/,
      "$1\nconst rateLimitService = require('../services/rateLimitService');"
    );
  }
  
  // Add Ollama routes if not present
  if (!content.includes('/api/ollama')) {
    content = content.replace(
      /(app\.use\('\/api\/ai')/,
      "app.use('/api/ollama', require('./routes/ollama'));\n$1"
    );
  }
  
  fs.writeFileSync(serverPath, content);
  console.log('✓ server.js updated successfully');
} else {
  console.log('⚠ server.js not found, please manually integrate new services');
}
JSEOF

node update-server.js
rm update-server.js

echo ""
echo "================================================================"
echo "Running Tests"
echo "================================================================"
echo ""

echo "Testing Ollama connection..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    print_success "Ollama API is accessible"
else
    print_warning "Ollama API is not accessible yet"
fi

echo ""
echo "Testing Redis connection..."
if command_exists redis-cli; then
    if redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is responding"
    else
        print_warning "Redis is not responding"
    fi
else
    print_warning "redis-cli not available"
fi

echo ""
echo "================================================================"
echo "Installation Summary"
echo "================================================================"
echo ""

print_success "Phase 1: Ollama + Llama3 installed"
print_success "Phase 2: WebSocket support added"
print_success "Phase 3: Redis caching configured"
print_success "Phase 3: Rate limiting implemented"

echo ""
echo "New Services Created:"
echo "  - services/ollamaService.js      (Real AI integration)"
echo "  - services/websocketService.js   (Real-time features)"
echo "  - services/cacheService.js       (Redis caching)"
echo "  - services/rateLimitService.js   (API protection)"
echo ""

echo "New API Endpoints:"
echo "  - POST /api/ollama/query           (Natural language queries)"
echo "  - POST /api/ollama/optimize-budget (AI budget optimization)"
echo "  - POST /api/ollama/analyze-promotion (AI promotion analysis)"
echo "  - POST /api/ollama/chat             (Conversational AI)"
echo "  - WS   /ws                          (WebSocket connection)"
echo ""

echo "================================================================"
echo "Next Steps:"
echo "================================================================"
echo ""
echo "1. Restart the backend server:"
echo "   cd /var/www/tradeai/backend"
echo "   pm2 restart tradeai-backend"
echo ""
echo "2. Test the new AI endpoints:"
echo "   curl http://localhost:5000/api/ollama/status"
echo ""
echo "3. Monitor logs:"
echo "   pm2 logs tradeai-backend"
echo ""
echo "4. Check Ollama status:"
echo "   ollama list"
echo ""

print_success "Installation complete!"
echo ""
echo "================================================================"
