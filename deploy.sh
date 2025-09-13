#!/bin/bash

# TRADEAI Simple Deployment Script
# This script deploys TRADEAI with a single command

set -e

echo "🚀 TRADEAI Simple Deployment Starting..."
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "   sudo sh get-docker.sh"
    echo "   sudo usermod -aG docker \$USER"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "   sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

# Use docker compose or docker-compose based on availability
DOCKER_COMPOSE="docker-compose"
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
fi

echo "✅ Docker and Docker Compose are available"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
$DOCKER_COMPOSE -f docker-compose.simple.yml down --remove-orphans 2>/dev/null || true

# Clean up old images (optional)
echo "🧹 Cleaning up old images..."
docker system prune -f 2>/dev/null || true

# Build and start services
echo "🏗️ Building and starting TRADEAI services..."
$DOCKER_COMPOSE -f docker-compose.simple.yml build --no-cache
$DOCKER_COMPOSE -f docker-compose.simple.yml up -d

echo "⏳ Waiting for services to start..."

# Wait for MongoDB
echo "🔍 Waiting for MongoDB..."
timeout 60 bash -c 'until docker exec tradeai_mongodb mongosh --eval "db.adminCommand(\"ping\")" > /dev/null 2>&1; do sleep 2; echo -n "."; done'
echo " ✅ MongoDB is ready"

# Wait for Redis
echo "🔍 Waiting for Redis..."
timeout 60 bash -c 'until docker exec tradeai_redis redis-cli ping > /dev/null 2>&1; do sleep 2; echo -n "."; done'
echo " ✅ Redis is ready"

# Wait for Backend
echo "🔍 Waiting for Backend API..."
timeout 120 bash -c 'until curl -f http://localhost:5000/api/health > /dev/null 2>&1; do sleep 3; echo -n "."; done'
echo " ✅ Backend API is ready"

# Wait for Frontend
echo "🔍 Waiting for Frontend..."
timeout 60 bash -c 'until curl -f http://localhost:3000 > /dev/null 2>&1; do sleep 3; echo -n "."; done'
echo " ✅ Frontend is ready"

echo ""
echo "🎉 TRADEAI Deployment Complete!"
echo "==============================="
echo ""
echo "🌐 Access your TRADEAI platform:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000"
echo "   API Docs:  http://localhost:5000/api/docs"
echo ""
echo "🔐 Default Login Credentials:"
echo "   Email:     admin@tradeai.com"
echo "   Password:  admin123"
echo ""
echo "📋 Management Commands:"
echo "   View logs:    $DOCKER_COMPOSE -f docker-compose.simple.yml logs -f"
echo "   Stop:         $DOCKER_COMPOSE -f docker-compose.simple.yml down"
echo "   Restart:      $DOCKER_COMPOSE -f docker-compose.simple.yml restart"
echo "   Status:       $DOCKER_COMPOSE -f docker-compose.simple.yml ps"
echo ""
echo "🔧 Troubleshooting:"
echo "   Backend logs: docker logs tradeai_backend"
echo "   Frontend logs: docker logs tradeai_frontend"
echo "   MongoDB logs: docker logs tradeai_mongodb"
echo "   Redis logs:   docker logs tradeai_redis"
echo ""

# Test the deployment
echo "🧪 Running deployment test..."
if curl -s http://localhost:5000/api/health | grep -q "OK"; then
    echo "✅ Backend health check: PASSED"
else
    echo "❌ Backend health check: FAILED"
    echo "   Check logs: docker logs tradeai_backend"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend accessibility: PASSED"
else
    echo "❌ Frontend accessibility: FAILED"
    echo "   Check logs: docker logs tradeai_frontend"
fi

echo ""
echo "🚀 Your TRADEAI platform is ready!"
echo "   Open http://localhost:3000 in your browser to get started."
echo ""