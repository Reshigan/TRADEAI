#!/bin/bash

# Deploy frontend to production server
echo "🚀 Deploying frontend to production server..."

# Server details
SERVER="ec2-18-133-249-77.eu-west-2.compute.amazonaws.com"
USER="ubuntu"
REMOTE_PATH="/var/www/html"
LOCAL_BUILD_PATH="./frontend/build"

# Check if build directory exists
if [ ! -d "$LOCAL_BUILD_PATH" ]; then
    echo "❌ Build directory not found. Please run 'npm run build' first."
    exit 1
fi

echo "📦 Copying build files to server..."

# Use rsync to copy files (more reliable than scp for directories)
rsync -avz --delete \
    -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
    "$LOCAL_BUILD_PATH/" \
    "$USER@$SERVER:$REMOTE_PATH/"

if [ $? -eq 0 ]; then
    echo "✅ Frontend deployment completed successfully!"
    echo "🌐 Application should be available at: https://tradeai.gonxt.tech"
else
    echo "❌ Deployment failed!"
    exit 1
fi