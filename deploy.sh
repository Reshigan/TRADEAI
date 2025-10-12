echo "🚀 TRADEAI Production Deployment Script"
echo "Timestamp: $(date)"

# Pull latest changes
git pull origin main

# Install backend dependencies
cd backend
npm install --production
cd ..

# Build and install frontend
cd frontend  
npm install
npm run build
cd ..

# Restart services with PM2
pm2 restart all || pm2 start ecosystem.config.js

