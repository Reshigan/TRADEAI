#!/usr/bin/env bash
set -euo pipefail


APP_DIR="/opt/tradeai"
BACKEND_DIR="$APP_DIR/backend"

echo "[deploy] Starting production deployment at $(date -Is)"

cd "$APP_DIR"

echo "[deploy] Pulling latest code from main branch..."
git fetch origin
git checkout main
git reset --hard origin/main

if [ -f "$BACKEND_DIR/package.json" ]; then
  echo "[deploy] Installing backend dependencies..."
  cd "$BACKEND_DIR"
  
  if [ -f "package-lock.json" ]; then
    npm ci
  else
    npm install
  fi
  
  cd "$APP_DIR"
fi

echo "[deploy] Restarting backend service..."
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart tradeai-backend || {
    echo "[deploy] PM2 restart failed, attempting to start..."
    pm2 start "$BACKEND_DIR/src/server.js" --name tradeai-backend
  }
  
  pm2 list
else
  echo "[deploy] ERROR: PM2 not found. Cannot restart backend."
  exit 1
fi

if command -v systemctl >/dev/null 2>&1; then
  echo "[deploy] Reloading nginx..."
  sudo systemctl reload nginx || echo "[deploy] WARNING: nginx reload failed (may not be needed)"
fi

echo "[deploy] Verifying deployment..."
sleep 5  # Give the service time to start

if curl -f -s http://localhost:5000/api/health > /dev/null; then
  echo "[deploy] ✅ Backend health check passed"
else
  echo "[deploy] ⚠️  Backend health check failed"
fi

echo "[deploy] Deployment completed at $(date -Is)"
echo "[deploy] Application version: $(git rev-parse --short HEAD)"
