# 🚀 TRADEAI Quick Setup Guide

## ⚡ 5-Minute Production Setup

### Step 1: Configure Backend CORS (2 minutes)

```bash
# 1. Set SSH key permissions
chmod 600 /workspace/project/Vantax-2.pem

# 2. Connect to backend server
ssh -i /workspace/project/Vantax-2.pem ubuntu@tradeai.gonxt.tech
# If that doesn't work, try:
# ssh -i /workspace/project/Vantax-2.pem ec2-user@<IP_ADDRESS>

# 3. Find backend directory
cd /var/www/tradeai-backend  # or wherever backend is located
ls -la

# 4. Edit CORS configuration
nano server.js  # or app.js, or index.js

# 5. Add this CORS configuration:
```

**Add to your Express server:**

```javascript
const cors = require('cors');

const corsOptions = {
  origin: [
    'https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev',
    'https://your-custom-domain.com',
    'http://localhost:5173',
    'http://localhost:12000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

**Restart backend:**

```bash
# If using PM2
pm2 restart tradeai-backend

# If using systemd
sudo systemctl restart tradeai-backend

# Check status
pm2 status
# or
sudo systemctl status tradeai-backend
```

**Exit SSH:**

```bash
exit
```

---

### Step 2: Set Up Monitoring (3 minutes)

**Option A: UptimeRobot (Free, Recommended)**

1. Go to: https://uptimerobot.com/signUp
2. Click "Add New Monitor"
3. Fill in:
   - **Type**: HTTP(s)
   - **Friendly Name**: TRADEAI Frontend
   - **URL**: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev
   - **Interval**: 5 minutes
4. Click "Create Monitor"
5. Add your email for alerts
6. **Repeat** for backend:
   - **URL**: https://tradeai.gonxt.tech/api/health

**Done!** You'll get email alerts if the site goes down.

---

**Option B: Custom Monitoring Script (Local)**

```bash
# Create and run monitoring script
cd /workspace/project/TRADEAI/frontend-v3
node -e "
const http = require('http');
const https = require('https');

setInterval(() => {
  // Check frontend
  http.get('http://localhost:12000/health', (res) => {
    console.log('[Frontend] Status:', res.statusCode === 200 ? '✅ UP' : '❌ DOWN');
  }).on('error', (e) => console.error('[Frontend] Error:', e.message));
  
  // Check backend
  https.get('https://tradeai.gonxt.tech/api/health', (res) => {
    console.log('[Backend] Status:', res.statusCode === 200 ? '✅ UP' : '❌ DOWN');
  }).on('error', (e) => console.error('[Backend] Error:', e.message));
}, 60000); // Check every minute
" &

echo "Monitoring started in background"
```

---

## ✅ Verification

### Test CORS:

Visit: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev

Open browser console:

```javascript
// Should work without CORS error
fetch('https://tradeai.gonxt.tech/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Test Monitoring:

Check UptimeRobot dashboard - should see monitors as "Up"

---

## 📞 Quick Reference

### Backend Access
- **SSH Key**: `/workspace/project/Vantax-2.pem`
- **Command**: `ssh -i /workspace/project/Vantax-2.pem ubuntu@tradeai.gonxt.tech`

### Frontend URLs
- **Production**: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev
- **Health Check**: http://localhost:12000/health
- **Test Auth**: http://localhost:12000/test-auth.html

### Backend URLs
- **API Base**: https://tradeai.gonxt.tech/api
- **Health Check**: https://tradeai.gonxt.tech/api/health
- **Login**: https://tradeai.gonxt.tech/api/auth/login

### Key Files
- **CORS Guide**: `BACKEND_CORS_SETUP.md`
- **Monitoring Guide**: `MONITORING_SETUP.md`
- **Production Guide**: `PRODUCTION_READY_FINAL.md`

---

## 🎯 What's Next?

1. ✅ CORS configured → Frontend can call API
2. ✅ Monitoring set up → Get alerts if down
3. ⏳ Deploy to custom domain (optional)
4. ⏳ Add error tracking (Sentry)
5. ⏳ Add analytics (Google Analytics)

---

**Setup Time**: 5 minutes  
**Cost**: Free  
**Status**: Production Ready! 🎉
