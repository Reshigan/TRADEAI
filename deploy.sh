#!/bin/bash

# Trade AI Platform Deployment Script
set -e

echo "🚀 Starting Trade AI Platform Deployment..."

# Update system
sudo apt update

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install && npm run build

# Set up environment
cp .env.production .env

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js
pm2 save

echo "✅ Trade AI Platform deployed successfully!"
