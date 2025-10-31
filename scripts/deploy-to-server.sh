#!/bin/bash

#########################################################
# TRADEAI - Deploy Latest Frontend to Server
# 
# Deploys the latest frontend code to the production server
# Usage: ./deploy-to-server.sh
#########################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SSH_KEY="/workspace/project/Vantax-2.pem"
SERVER_USER="ubuntu"
SERVER_HOST="tradeai.gonxt.tech"
GITHUB_TOKEN="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"
DEPLOY_DIR="/tmp/tradeai-deploy"
FRONTEND_DIR="/var/www/tradeai-frontend"
GITHUB_REPO="https://github.com/Reshigan/TRADEAI.git"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        TRADEAI Frontend Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ SSH key not found: $SSH_KEY${NC}"
    exit 1
fi

chmod 600 "$SSH_KEY"
echo -e "${GREEN}✅ SSH key ready${NC}"

echo -e "\n${YELLOW}📋 Deployment Details:${NC}"
echo -e "   Server: ${SERVER_HOST}"
echo -e "   User: ${SERVER_USER}"
echo -e "   Target: ${FRONTEND_DIR}"
echo -e "   Repo: ${GITHUB_REPO}\n"

# Create deployment script to run on server
DEPLOY_SCRIPT=$(cat <<'EOFSCRIPT'
#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOY_DIR="/tmp/tradeai-deploy"
FRONTEND_DIR="/var/www/tradeai-frontend"
GITHUB_TOKEN="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"
GITHUB_REPO="https://${GITHUB_TOKEN}@github.com/Reshigan/TRADEAI.git"

echo -e "${BLUE}[1/6] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"
echo -e "${GREEN}✅ npm: $(npm -v)${NC}"

echo -e "\n${BLUE}[2/6] Cleaning up old deployment...${NC}"
rm -rf ${DEPLOY_DIR}
mkdir -p ${DEPLOY_DIR}

echo -e "\n${BLUE}[3/6] Cloning latest code from GitHub...${NC}"
cd ${DEPLOY_DIR}
git clone ${GITHUB_REPO} .
echo -e "${GREEN}✅ Code cloned${NC}"

echo -e "\n${BLUE}[4/6] Installing dependencies...${NC}"
cd ${DEPLOY_DIR}/frontend-v3
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found in frontend-v3${NC}"
    exit 1
fi
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "\n${BLUE}[5/6] Building production bundle...${NC}"
if [ ! -f "index.html" ]; then
    echo -e "${RED}❌ index.html not found${NC}"
    exit 1
fi
npm run build
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not created${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build complete${NC}"

echo -e "\n${BLUE}[6/6] Deploying to ${FRONTEND_DIR}...${NC}"
sudo mkdir -p ${FRONTEND_DIR}
sudo chown -R $USER:$USER ${FRONTEND_DIR}
cp -r dist/* ${FRONTEND_DIR}/
echo -e "${GREEN}✅ Files deployed to ${FRONTEND_DIR}${NC}"

echo -e "\n${BLUE}Cleaning up...${NC}"
cd /tmp
rm -rf ${DEPLOY_DIR}

echo -e "\n${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}\n"

# Check if Nginx is installed
if command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx detected. Remember to configure Nginx if not done yet!${NC}"
    echo -e "Run: sudo systemctl status nginx\n"
fi

# Check deployed files
echo -e "${CYAN}📂 Deployed Files:${NC}"
ls -lh ${FRONTEND_DIR}/ | head -10

echo -e "\n${CYAN}📊 Disk Usage:${NC}"
du -sh ${FRONTEND_DIR}

EOFSCRIPT
)

echo -e "${BLUE}Connecting to server and deploying...${NC}\n"

# Execute deployment on server
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_HOST}" "bash -s" <<< "$DEPLOY_SCRIPT"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 Deployment Successful!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}\n"
    
    echo -e "${YELLOW}🧪 Test Your Deployment:${NC}"
    echo -e "   1. If using Nginx: https://app.tradeai.gonxt.tech"
    echo -e "   2. Or test locally on server: cd /var/www/tradeai-frontend && python3 -m http.server 8080"
    echo -e ""
    echo -e "${YELLOW}🔧 Next Steps:${NC}"
    echo -e "   1. Configure Nginx (if not done): ./setup-ssl-nginx.sh"
    echo -e "   2. Update backend CORS: ./setup-cors.sh"
    echo -e "   3. Set up monitoring: https://uptimerobot.com/signUp"
    echo -e ""
else
    echo -e "\n${RED}═══════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ Deployment Failed${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════${NC}\n"
    exit 1
fi
