#!/bin/bash

# Deploy backend to production server
echo "🚀 Deploying backend to production server..."

# Server details
SERVER="ec2-18-133-249-77.eu-west-2.compute.amazonaws.com"
USER="ubuntu"
REMOTE_PATH="/opt/tradeai/TRADEAI/backend"
LOCAL_BACKEND_PATH="./backend"

# Check if backend directory exists
if [ ! -d "$LOCAL_BACKEND_PATH" ]; then
    echo "❌ Backend directory not found."
    exit 1
fi

echo "📦 Copying backend files to server..."

# Copy the updated routes
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    "$LOCAL_BACKEND_PATH/src/routes/index.js" \
    "$USER@$SERVER:$REMOTE_PATH/src/routes/"

if [ $? -eq 0 ]; then
    echo "✅ Backend routes updated successfully!"
    
    echo "🔄 Restarting backend service..."
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$USER@$SERVER" "cd $REMOTE_PATH && pm2 restart tradeai-backend"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backend service restarted successfully!"
        echo "🌐 Backend should be available at: https://tradeai.gonxt.tech/api"
    else
        echo "❌ Failed to restart backend service!"
        exit 1
    fi
else
    echo "❌ Backend deployment failed!"
    exit 1
fi