#!/bin/bash

# TRADEAI Production Startup Script
# This script starts the TRADEAI application with production settings

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}TRADEAI Production Startup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    echo -e "${RED}ERROR: backend/.env file not found!${NC}"
    echo -e "${YELLOW}Please create backend/.env from backend/.env.example${NC}"
    exit 1
fi

# Check critical environment variables
echo -e "${BLUE}Checking environment configuration...${NC}"

DATABASE_MODE=$(grep "^DATABASE_MODE=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 || echo "")
MOCK_DATA=$(grep "^MOCK_DATA_ENABLED=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 || echo "")

if [ "$DATABASE_MODE" = "mock" ] || [ "$MOCK_DATA" = "true" ]; then
    echo -e "${RED}ERROR: Mock mode is enabled!${NC}"
    echo -e "${YELLOW}For production, set in backend/.env:${NC}"
    echo -e "  DATABASE_MODE=real"
    echo -e "  MOCK_DATA_ENABLED=false"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if MongoDB URI is set
MONGODB_URI=$(grep "^MONGODB_URI=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 || echo "")
if [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}ERROR: MONGODB_URI not set in backend/.env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment configuration OK${NC}"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    USE_DOCKER=true
    echo -e "${BLUE}Docker detected - will use Docker Compose${NC}"
else
    USE_DOCKER=false
    echo -e "${YELLOW}Docker not found - will start services manually${NC}"
fi
echo ""

# Function to check if MongoDB is running
check_mongodb() {
    if mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" --quiet &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to check if Redis is running
check_redis() {
    REDIS_HOST=$(grep "^REDIS_HOST=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 || echo "localhost")
    REDIS_PORT=$(grep "^REDIS_PORT=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 || echo "6379")
    REDIS_PASSWORD=$(grep "^REDIS_PASSWORD=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 || echo "")
    
    if [ -n "$REDIS_PASSWORD" ]; then
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping &> /dev/null
    else
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &> /dev/null
    fi
}

# Start services
echo -e "${BLUE}Starting services...${NC}"
echo ""

if [ "$USE_DOCKER" = true ]; then
    # Start with Docker Compose
    cd "$PROJECT_ROOT"
    
    echo -e "${BLUE}Starting MongoDB and Redis with Docker Compose...${NC}"
    docker compose -f docker-compose.local-prod.yml up -d mongodb redis
    
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    sleep 10
    
    echo -e "${BLUE}Starting Backend...${NC}"
    docker compose -f docker-compose.local-prod.yml up -d backend
    
    echo -e "${BLUE}Starting Frontend...${NC}"
    docker compose -f docker-compose.local-prod.yml up -d frontend
    
    echo ""
    echo -e "${GREEN}✓ All services started successfully${NC}"
    echo ""
    echo -e "${BLUE}Service URLs:${NC}"
    echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "  Backend API: ${GREEN}http://localhost:5000${NC}"
    echo -e "  MongoDB: ${GREEN}mongodb://localhost:27017${NC}"
    echo -e "  Redis: ${GREEN}redis://localhost:6379${NC}"
    echo ""
    echo -e "${BLUE}View logs:${NC}"
    echo -e "  docker compose -f docker-compose.local-prod.yml logs -f"
    echo ""
    echo -e "${BLUE}Stop services:${NC}"
    echo -e "  docker compose -f docker-compose.local-prod.yml down"
    
else
    # Start services manually
    echo -e "${BLUE}Checking MongoDB...${NC}"
    if check_mongodb; then
        echo -e "${GREEN}✓ MongoDB is running${NC}"
    else
        echo -e "${RED}✗ MongoDB is not running${NC}"
        echo -e "${YELLOW}Please start MongoDB manually:${NC}"
        echo -e "  mongod --auth --bind_ip_all --port 27017"
        exit 1
    fi
    
    echo -e "${BLUE}Checking Redis...${NC}"
    if check_redis; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠ Redis is not running (optional but recommended)${NC}"
        echo -e "${YELLOW}To start Redis:${NC}"
        echo -e "  redis-server --requirepass redis123"
    fi
    
    echo ""
    echo -e "${BLUE}Starting Backend...${NC}"
    cd "$PROJECT_ROOT/backend"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install
    fi
    
    # Start backend in background
    npm start > "$PROJECT_ROOT/backend/logs/startup.log" 2>&1 &
    BACKEND_PID=$!
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
    
    # Wait for backend to be ready
    echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend is ready${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${RED}✗ Backend failed to start${NC}"
            echo -e "${YELLOW}Check logs: $PROJECT_ROOT/backend/logs/startup.log${NC}"
            exit 1
        fi
    done
    
    echo ""
    echo -e "${BLUE}Starting Frontend...${NC}"
    cd "$PROJECT_ROOT/frontend"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install
    fi
    
    # Start frontend in background
    PORT=3000 npm start > "$PROJECT_ROOT/frontend/logs/startup.log" 2>&1 &
    FRONTEND_PID=$!
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
    
    echo ""
    echo -e "${GREEN}✓ All services started successfully${NC}"
    echo ""
    echo -e "${BLUE}Service URLs:${NC}"
    echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "  Backend API: ${GREEN}http://localhost:5000${NC}"
    echo ""
    echo -e "${BLUE}Process IDs:${NC}"
    echo -e "  Backend: ${BACKEND_PID}"
    echo -e "  Frontend: ${FRONTEND_PID}"
    echo ""
    echo -e "${BLUE}View logs:${NC}"
    echo -e "  Backend: tail -f $PROJECT_ROOT/backend/logs/startup.log"
    echo -e "  Frontend: tail -f $PROJECT_ROOT/frontend/logs/startup.log"
    echo ""
    echo -e "${BLUE}Stop services:${NC}"
    echo -e "  kill $BACKEND_PID $FRONTEND_PID"
    
    # Save PIDs to file
    echo "$BACKEND_PID" > "$PROJECT_ROOT/.backend.pid"
    echo "$FRONTEND_PID" > "$PROJECT_ROOT/.frontend.pid"
fi

# Check if users exist
echo ""
echo -e "${BLUE}Checking database users...${NC}"
USER_COUNT=$(mongosh "$MONGODB_URI" --quiet --eval "db.users.countDocuments()" 2>/dev/null || echo "0")

if [ "$USER_COUNT" -eq "0" ]; then
    echo -e "${YELLOW}⚠ No users found in database${NC}"
    echo -e "${YELLOW}Run the seeding script to create initial users:${NC}"
    echo -e "  cd $PROJECT_ROOT"
    echo -e "  node scripts/seed-production-users.js"
    echo ""
else
    echo -e "${GREEN}✓ Found $USER_COUNT user(s) in database${NC}"
    echo ""
    echo -e "${BLUE}Default login credentials:${NC}"
    echo -e "  Email: ${GREEN}admin@tradeai.com${NC}"
    echo -e "  Password: ${GREEN}Admin@123${NC}"
    echo ""
    echo -e "${RED}⚠ IMPORTANT: Change default passwords after first login!${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Startup complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Open ${GREEN}http://localhost:3000${NC} in your browser"
echo -e "2. Login with ${GREEN}admin@tradeai.com${NC} / ${GREEN}Admin@123${NC}"
echo -e "3. Change your password immediately"
echo -e "4. Configure additional users if needed"
echo ""
