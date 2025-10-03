#!/bin/bash

# Git-based Production Deployment Script for TradeAI
# This script deploys the latest code from GitHub to the AWS production server

set -e

echo "🚀 Starting TradeAI Git-based Production Deployment..."

# Configuration
DEPLOY_DIR="/opt/tradeai-git/TRADEAI"
BACKUP_DIR="/opt/tradeai-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
sudo mkdir -p $BACKUP_DIR

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to handle errors
handle_error() {
    log "❌ Error occurred during deployment. Rolling back..."
    if [ -d "$BACKUP_DIR/backup_$TIMESTAMP" ]; then
        log "Restoring from backup..."
        sudo cp -r $BACKUP_DIR/backup_$TIMESTAMP/* $DEPLOY_DIR/
        cd $DEPLOY_DIR
        pm2 restart tradeai-backend-git
    fi
    exit 1
}

# Set error handler
trap handle_error ERR

# Create backup
log "📦 Creating backup..."
sudo mkdir -p $BACKUP_DIR/backup_$TIMESTAMP
sudo cp -r $DEPLOY_DIR/* $BACKUP_DIR/backup_$TIMESTAMP/

# Navigate to deployment directory
cd $DEPLOY_DIR

# Pull latest code
log "📥 Pulling latest code from GitHub..."
git pull origin main

# Install backend dependencies
log "📦 Installing backend dependencies..."
cd backend
npm install --production

# Restart PM2 process
log "🔄 Restarting backend service..."
pm2 restart tradeai-backend-git

# Save PM2 configuration
pm2 save

# Health check
log "🏥 Performing health check..."
sleep 5
if curl -f http://localhost:5002/api/health > /dev/null 2>&1; then
    log "✅ Health check passed!"
else
    log "❌ Health check failed!"
    handle_error
fi

# Clean up old backups (keep last 5)
log "🧹 Cleaning up old backups..."
cd $BACKUP_DIR
ls -t | tail -n +6 | xargs -r sudo rm -rf

log "🎉 Git-based deployment completed successfully!"
log "📊 Backend is running on port 5002"
log "🔍 Check logs with: pm2 logs tradeai-backend-git"