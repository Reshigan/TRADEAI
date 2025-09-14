# TRADEAI Deployment Fix Guide

## Issue Summary

The live website at `https://tradeai.gonxt.tech` is not serving the latest frontend build and has SSL certificate issues. 

**Current Status:**
- ❌ Live site serves old frontend: `main.7c0f48f4.js`
- ✅ Local build has latest version: `main.4f1b9fb8.js`
- ❌ SSL certificate error: `ERR_CERT_AUTHORITY_INVALID`
- ✅ Server responds with HTTP 200 (content is accessible)

## Root Causes

1. **Outdated Frontend Build**: The Docker deployment is not using the latest frontend build
2. **SSL Certificate Issue**: Invalid or expired SSL certificate
3. **Deployment Process**: Server needs to pull latest changes and rebuild

## Required Fixes

### 1. Update Git Repository (If Needed)

If you have access to push to the repository:
```bash
cd /opt/tradeai  # or wherever the project is deployed
git pull origin main
```

### 2. Fix SSL Certificate

The SSL certificate for `tradeai.gonxt.tech` is invalid. You need to:

**Option A: Renew Let's Encrypt Certificate**
```bash
sudo certbot renew --nginx
sudo systemctl reload nginx
```

**Option B: Generate New Certificate**
```bash
sudo certbot --nginx -d tradeai.gonxt.tech
```

**Option C: Check Certificate Status**
```bash
sudo certbot certificates
openssl x509 -in /etc/letsencrypt/live/tradeai.gonxt.tech/fullchain.pem -text -noout
```

### 3. Rebuild and Redeploy Frontend

**Method 1: Full Docker Rebuild**
```bash
cd /opt/tradeai  # or your deployment directory
sudo docker compose down
sudo docker compose build --no-cache frontend
sudo docker compose up -d
```

**Method 2: Force Frontend Rebuild**
```bash
cd /opt/tradeai
sudo docker compose down frontend
sudo docker rmi trade-ai-frontend 2>/dev/null || true
sudo docker compose up -d --build frontend
```

**Method 3: Manual Frontend Build (if Docker issues persist)**
```bash
cd /opt/tradeai/frontend
npm install
npm run build
sudo docker compose restart nginx
```

### 4. Verify Deployment

After rebuilding, verify the deployment:

```bash
# Check service status
sudo docker compose ps

# Check frontend build version
curl -s https://tradeai.gonxt.tech | grep -o 'main\.[a-f0-9]*\.js'
# Should show: main.4f1b9fb8.js (or newer)

# Test SSL certificate
curl -I https://tradeai.gonxt.tech
# Should not show certificate errors

# Check all services
curl -f https://tradeai.gonxt.tech/health.json
curl -f https://tradeai.gonxt.tech/api/v1/health
```

## Expected Results After Fix

1. **Frontend**: Latest build with all features:
   - ✅ ZAR currency defaults
   - ✅ Trading Terms management
   - ✅ Platform walkthrough
   - ✅ Enhanced settings page
   - ✅ Proper popup display

2. **SSL**: Valid certificate with no browser warnings

3. **Build Version**: `main.4f1b9fb8.js` or newer

## Troubleshooting

### If Frontend Still Shows Old Version

1. **Clear Docker Build Cache**:
   ```bash
   sudo docker system prune -a
   sudo docker compose build --no-cache
   ```

2. **Check Nginx Cache**:
   ```bash
   sudo docker compose exec nginx nginx -s reload
   ```

3. **Verify Build Files**:
   ```bash
   sudo docker compose exec frontend ls -la /usr/share/nginx/html/static/js/
   ```

### If SSL Issues Persist

1. **Check Nginx Configuration**:
   ```bash
   sudo docker compose exec nginx nginx -t
   ```

2. **Verify Certificate Files**:
   ```bash
   ls -la /etc/letsencrypt/live/tradeai.gonxt.tech/
   ```

3. **Check Domain DNS**:
   ```bash
   nslookup tradeai.gonxt.tech
   ```

## Quick Fix Script

Create and run this script on the server:

```bash
#!/bin/bash
# quick-deployment-fix.sh

echo "🔧 TRADEAI Deployment Fix"
echo "========================="

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Rebuild frontend with no cache
echo "🏗️ Rebuilding frontend..."
sudo docker compose down frontend
sudo docker rmi trade-ai-frontend 2>/dev/null || true
sudo docker compose up -d --build frontend

# Restart nginx
echo "🔄 Restarting nginx..."
sudo docker compose restart nginx

# Verify deployment
echo "✅ Verifying deployment..."
sleep 10
curl -I https://tradeai.gonxt.tech

echo "🎉 Deployment fix complete!"
echo "Please test: https://tradeai.gonxt.tech"
```

## Contact Information

If you need assistance with server access or deployment issues, the local development environment is fully functional at:
- **Local Frontend**: https://work-2-bgknypknlkladkjd.prod-runtime.all-hands.dev
- **Local Backend**: https://work-1-bgknypknlkladkjd.prod-runtime.all-hands.dev

All features are working perfectly in the local environment and ready for production deployment.