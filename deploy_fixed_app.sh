#!/bin/bash

# Deploy Fixed TRADEAI Application
set -e

echo "🚀 Deploying Fixed TRADEAI Application..."

# Kill any existing processes
echo "🔄 Stopping existing processes..."
pkill -f "node.*server.js" || true
pkill -f "serve.*build" || true
pm2 delete all || true

# Wait a moment for processes to stop
sleep 2

# Start backend server
echo "🔧 Starting backend server..."
cd /workspace/project/TRADEAI/backend
NODE_ENV=production PORT=5002 node src/server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Start frontend server
echo "🌐 Starting frontend server..."
cd /workspace/project/TRADEAI/frontend
npx serve -s build -l 3000 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Wait a moment for servers to start
sleep 3

# Check if servers are running
echo "🔍 Checking server status..."
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend server is running (PID: $BACKEND_PID)"
else
    echo "❌ Backend server failed to start"
fi

if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ Frontend server is running (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend server failed to start"
fi

# Test the deployment
echo "🧪 Testing deployment..."
sleep 2

# Test backend
if curl -s http://localhost:5002/api/health > /dev/null; then
    echo "✅ Backend API is responding"
else
    echo "❌ Backend API is not responding"
fi

# Test frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend is not responding"
fi

echo ""
echo "🎉 Deployment Complete!"
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend API: http://localhost:5002/api"
echo "📍 Health Check: http://localhost:5002/api/health"
echo ""
echo "📋 Process IDs:"
echo "   Backend: $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   Backend: /workspace/project/TRADEAI/logs/backend.log"
echo "   Frontend: /workspace/project/TRADEAI/logs/frontend.log"
echo ""
echo "🔧 To stop services:"
echo "   kill $BACKEND_PID $FRONTEND_PID"