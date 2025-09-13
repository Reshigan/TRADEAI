#!/bin/bash

# TRADEAI Backend Startup Diagnostic Script
# Helps diagnose and fix slow backend startup issues

echo "🔍 TRADEAI Backend Startup Diagnostics"
echo "======================================"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if containers exist
echo ""
echo "📊 Container Status:"
docker ps -a --filter "name=tradeai" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check backend container specifically
if docker ps -a --filter "name=tradeai_backend_live" | grep -q "tradeai_backend_live"; then
    echo ""
    echo "🔍 Backend Container Logs (last 20 lines):"
    echo "----------------------------------------"
    docker logs --tail 20 tradeai_backend_live
    
    echo ""
    echo "🔍 Backend Container Details:"
    echo "----------------------------"
    docker inspect tradeai_backend_live --format '{{.State.Status}}: {{.State.Error}}'
    
    # Check if backend is responding
    echo ""
    echo "🏥 Health Check Test:"
    echo "-------------------"
    if curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
        echo "✅ Backend health check passed"
        curl -s http://localhost:5000/api/health | jq . 2>/dev/null || curl -s http://localhost:5000/api/health
    else
        echo "❌ Backend health check failed"
        
        # Try to connect to the container directly
        echo ""
        echo "🔍 Testing container internal health:"
        if docker exec tradeai_backend_live curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
            echo "✅ Internal health check passed - port mapping issue"
        else
            echo "❌ Internal health check failed - application issue"
        fi
    fi
    
    # Check resource usage
    echo ""
    echo "📊 Resource Usage:"
    echo "-----------------"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" tradeai_backend_live
    
else
    echo "❌ Backend container not found"
fi

# Check dependencies
echo ""
echo "🔗 Dependency Status:"
echo "--------------------"

# MongoDB
if docker ps --filter "name=tradeai_mongodb_live" | grep -q "Up"; then
    echo "✅ MongoDB is running"
    if docker exec tradeai_mongodb_live mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        echo "✅ MongoDB is responding"
    else
        echo "⚠️ MongoDB is not responding"
    fi
else
    echo "❌ MongoDB is not running"
fi

# Redis
if docker ps --filter "name=tradeai_redis_live" | grep -q "Up"; then
    echo "✅ Redis is running"
    if docker exec tradeai_redis_live redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis is responding"
    else
        echo "⚠️ Redis is not responding"
    fi
else
    echo "❌ Redis is not running"
fi

# Check system resources
echo ""
echo "💻 System Resources:"
echo "-------------------"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h . | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')"
echo "CPU Load: $(uptime | awk -F'load average:' '{print $2}')"

# Suggestions
echo ""
echo "💡 Troubleshooting Suggestions:"
echo "==============================="

if ! docker ps --filter "name=tradeai_backend_live" | grep -q "Up"; then
    echo "1. Backend container is not running. Try:"
    echo "   docker-compose -f docker-compose.live.yml up -d backend"
elif ! curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
    echo "1. Backend is not responding. Try:"
    echo "   docker-compose -f docker-compose.live.yml restart backend"
    echo "   docker logs -f tradeai_backend_live"
fi

echo "2. If startup is slow, try rebuilding with no cache:"
echo "   docker-compose -f docker-compose.live.yml build --no-cache backend"

echo "3. Check for port conflicts:"
echo "   sudo netstat -tulpn | grep :5000"

echo "4. Monitor startup in real-time:"
echo "   docker logs -f tradeai_backend_live"

echo "5. Force restart all services:"
echo "   docker-compose -f docker-compose.live.yml down"
echo "   docker-compose -f docker-compose.live.yml up -d"

echo ""
echo "🔧 Quick Fixes:"
echo "==============="
echo "# Restart backend only:"
echo "docker-compose -f docker-compose.live.yml restart backend"
echo ""
echo "# Rebuild and restart backend:"
echo "docker-compose -f docker-compose.live.yml up -d --build backend"
echo ""
echo "# View live logs:"
echo "docker logs -f tradeai_backend_live"