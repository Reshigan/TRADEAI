#!/bin/bash
# Quick Deploy - TRADEAI
# Run this and it handles everything

set -e

echo "========================================"
echo "  TRADEAI Quick Deploy"
echo "========================================"
echo ""

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare..."
    wrangler login
fi

echo "✅ Logged in to Cloudflare"
echo ""

# Run migrations
echo "📦 Running database migrations..."
wrangler d1 execute tradeai --remote --file workers-backend/migrations/0070_process_management.sql
echo "✅ Migrations complete"
echo ""

# Deploy backend
echo "🚀 Deploying backend..."
cd workers-backend
wrangler deploy
cd ..
echo "✅ Backend deployed"
echo ""

# Deploy frontend
echo "🎨 Deploying frontend..."
cd frontend
npm ci
npm run build
wrangler pages deploy dist --project-name=tradeai
cd ..
echo "✅ Frontend deployed"
echo ""

echo "========================================"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "Backend:  https://tradeai-api.vantax.workers.dev"
echo "Frontend: https://tradeai.vantax.co.za"
echo ""
echo "Testing endpoints..."
curl -s https://tradeai-api.vantax.workers.dev/health | jq -r '.status' || echo "⚠️  Backend check failed"
echo ""
