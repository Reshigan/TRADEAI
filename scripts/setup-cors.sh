#!/bin/bash

#########################################################
# TRADEAI Backend CORS Configuration Script
# 
# This script helps configure CORS on the backend server
# Usage: ./setup-cors.sh
#########################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSH_KEY="/workspace/project/Vantax-2.pem"
SERVER_USER="ubuntu"
SERVER_HOST="tradeai.gonxt.tech"
FRONTEND_DOMAIN="app.tradeai.gonxt.tech"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        TRADEAI Backend CORS Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ SSH key not found: $SSH_KEY${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SSH key found${NC}"

# Set correct permissions
chmod 600 "$SSH_KEY"
echo -e "${GREEN}✅ SSH key permissions set to 600${NC}\n"

# Display connection info
echo -e "${YELLOW}📡 Server Details:${NC}"
echo -e "   Host: ${SERVER_HOST}"
echo -e "   User: ${SERVER_USER}"
echo -e "   Key: ${SSH_KEY}\n"

echo -e "${YELLOW}🌐 Frontend Domain to Whitelist:${NC}"
echo -e "   https://${FRONTEND_DOMAIN}\n"

# Prompt for confirmation
read -p "$(echo -e ${YELLOW}Continue with CORS setup? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Setup cancelled${NC}"
    exit 1
fi

echo -e "\n${BLUE}Connecting to server...${NC}\n"

# Create CORS update script
CORS_SCRIPT=$(cat <<'EOF'
#!/bin/bash

# Find backend directory
BACKEND_DIRS=(
    "/var/www/tradeai-backend"
    "/home/ubuntu/tradeai-backend"
    "/opt/tradeai-backend"
    "/app/tradeai-backend"
)

BACKEND_DIR=""
for dir in "${BACKEND_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        BACKEND_DIR="$dir"
        echo "✅ Found backend at: $BACKEND_DIR"
        break
    fi
done

if [ -z "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found!"
    echo "Please manually locate your backend and update CORS configuration"
    exit 1
fi

cd "$BACKEND_DIR"

# Find main server file
SERVER_FILES=("server.js" "app.js" "index.js" "main.js" "src/server.js" "src/app.js")
SERVER_FILE=""

for file in "${SERVER_FILES[@]}"; do
    if [ -f "$file" ]; then
        SERVER_FILE="$file"
        echo "✅ Found server file: $SERVER_FILE"
        break
    fi
done

if [ -z "$SERVER_FILE" ]; then
    echo "❌ Server file not found!"
    echo "Backend files:"
    ls -la
    exit 1
fi

# Backup current file
cp "$SERVER_FILE" "${SERVER_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created: ${SERVER_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Display current CORS config
echo ""
echo "📋 Current CORS configuration:"
grep -A 10 "cors" "$SERVER_FILE" || echo "No CORS config found"

echo ""
echo "⚠️  Please manually update CORS configuration to include:"
echo "   'https://app.tradeai.gonxt.tech'"
echo ""
echo "Add this to your CORS origins array:"
echo ""
echo "const corsOptions = {"
echo "  origin: ["
echo "    'https://app.tradeai.gonxt.tech',  // <-- Add this line"
echo "    'https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev',"
echo "    'http://localhost:5173',"
echo "    'http://localhost:12000',"
echo "  ],"
echo "  credentials: true,"
echo "  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],"
echo "  allowedHeaders: ['Content-Type', 'Authorization'],"
echo "};"
echo ""

read -p "Open file in editor now? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ${EDITOR:-nano} "$SERVER_FILE"
fi

echo ""
read -p "CORS configuration updated? [y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please update CORS configuration manually"
    exit 1
fi

# Restart backend
echo ""
echo "🔄 Restarting backend..."

if command -v pm2 &> /dev/null; then
    echo "Using PM2..."
    pm2 restart all || pm2 restart tradeai-backend || pm2 restart backend
    sleep 2
    pm2 status
elif systemctl list-units --type=service | grep -q tradeai; then
    echo "Using systemd..."
    sudo systemctl restart tradeai-backend
    sleep 2
    sudo systemctl status tradeai-backend
else
    echo "⚠️  Could not automatically restart backend"
    echo "Please restart manually:"
    echo "  pm2 restart tradeai-backend"
    echo "  OR"
    echo "  sudo systemctl restart tradeai-backend"
fi

echo ""
echo "✅ CORS configuration complete!"
EOF
)

# Execute on remote server
ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_HOST}" "bash -s" <<< "$CORS_SCRIPT"

echo -e "\n${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ CORS Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}🧪 Test CORS Configuration:${NC}"
echo -e "   1. Visit: https://${FRONTEND_DOMAIN}"
echo -e "   2. Open browser console"
echo -e "   3. Run: fetch('https://${SERVER_HOST}/api/health').then(r=>r.json()).then(console.log)"
echo -e "   4. Should see response without CORS error\n"

echo -e "${BLUE}📚 Next Steps:${NC}"
echo -e "   1. Test frontend at: https://${FRONTEND_DOMAIN}"
echo -e "   2. Try Quick Login"
echo -e "   3. Verify all features work"
echo -e "   4. Set up monitoring (UptimeRobot)\n"

echo -e "${GREEN}🎉 All done!${NC}\n"
