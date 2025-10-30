#!/bin/bash

echo "🚀 Starting TRADEAI Production System..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check MongoDB connection
echo -e "${BLUE}📊 Checking MongoDB connection...${NC}"

# Start Backend
echo -e "${BLUE}🔧 Starting Backend API...${NC}"
cd backend
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
else
    echo -e "${RED}❌ .env file not found. Creating from example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env from example${NC}"
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    npm install
fi

# Start backend server
echo -e "${GREEN}🚀 Starting backend on port 5000...${NC}"
npm start &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 5

# Start Frontend
echo -e "${BLUE}🎨 Starting Frontend...${NC}"
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}🚀 Starting frontend on port 12000...${NC}"
npm run dev -- --host 0.0.0.0 --port 12000 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 5

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ TRADEAI is now running!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📡 Backend API:${NC} http://localhost:5000"
echo -e "${BLUE}🌐 Frontend:${NC}    https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev"
echo ""
echo -e "${BLUE}📊 Health Check:${NC} curl http://localhost:5000/health"
echo -e "${BLUE}📝 API Docs:${NC}     http://localhost:5000/api/docs"
echo ""
echo -e "${GREEN}🎯 Ready for testing!${NC}"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running
wait
