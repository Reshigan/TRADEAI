# 🚀 Deploy TRADEAI Frontend to tradeai.gonxt.tech with SSL

## 📋 Overview

This guide will help you deploy your TRADEAI frontend to the custom domain **tradeai.gonxt.tech** with SSL certificate.

**Goal**: Access frontend at `https://tradeai.gonxt.tech` (or subdomain like `https://app.tradeai.gonxt.tech`)

---

## 🎯 Deployment Options

### Option 1: Deploy to Subdomain (Recommended)

Use a subdomain like:
- `https://app.tradeai.gonxt.tech` (recommended)
- `https://portal.tradeai.gonxt.tech`
- `https://dashboard.tradeai.gonxt.tech`

**Why subdomain?**
- ✅ Backend API stays at `tradeai.gonxt.tech/api`
- ✅ Frontend at `app.tradeai.gonxt.tech`
- ✅ Clean separation
- ✅ Easier CORS configuration
- ✅ Better for scaling

### Option 2: Deploy to Root Domain

Use the root domain:
- `https://tradeai.gonxt.tech` (frontend)
- Move API to `https://api.tradeai.gonxt.tech`

**Requires**:
- Moving backend API to subdomain
- More complex setup

---

## 🚀 Quick Start: Deploy to Subdomain (Recommended)

### Step 1: Update DNS Records

1. **Log into your domain registrar** (GoDaddy, Namecheap, Cloudflare, etc.)

2. **Add DNS record**:
   ```
   Type: A
   Name: app
   Value: [Your Server IP]
   TTL: 3600
   ```

   Or if using Vercel/Netlify:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com (for Vercel)
   TTL: 3600
   ```

3. **Wait for DNS propagation** (5-30 minutes)
   ```bash
   # Check DNS propagation
   nslookup app.tradeai.gonxt.tech
   dig app.tradeai.gonxt.tech
   ```

### Step 2A: Deploy to Your Server (With Nginx + SSL)

**Prerequisites**:
- Server with Nginx installed
- SSH access with Vantax-2.pem
- Port 80 and 443 open

#### Connect to Server

```bash
ssh -i /workspace/project/Vantax-2.pem ubuntu@tradeai.gonxt.tech
```

#### Install Required Tools

```bash
# Update system
sudo apt update

# Install Nginx (if not already)
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Install Node.js (if not already)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Create Deployment Directory

```bash
# Create directory for frontend
sudo mkdir -p /var/www/tradeai-frontend
sudo chown -R $USER:$USER /var/www/tradeai-frontend
cd /var/www/tradeai-frontend
```

#### Upload Production Build

**From your local machine**:

```bash
# Build the frontend
cd /workspace/project/TRADEAI/frontend-v3
npm run build

# Upload to server
scp -i /workspace/project/Vantax-2.pem -r dist/* ubuntu@tradeai.gonxt.tech:/var/www/tradeai-frontend/
```

**Or clone from GitHub**:

```bash
# On the server
cd /var/www/tradeai-frontend
git clone https://github.com/Reshigan/TRADEAI.git temp
mv temp/frontend-v3/dist/* .
rm -rf temp

# Or if dist is not in repo, build on server
git clone https://github.com/Reshigan/TRADEAI.git
cd TRADEAI/frontend-v3
npm install
npm run build
sudo cp -r dist/* /var/www/tradeai-frontend/
cd ../..
rm -rf TRADEAI
```

#### Configure Nginx

**Create Nginx configuration**:

```bash
sudo tee /etc/nginx/sites-available/tradeai-frontend << 'EOF'
server {
    listen 80;
    server_name app.tradeai.gonxt.tech;
    
    # Redirect HTTP to HTTPS (will be enabled after SSL)
    # return 301 https://$server_name$request_uri;
    
    root /var/www/tradeai-frontend;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint (if using production server)
    location /health {
        proxy_pass http://localhost:12000/health;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

#### Enable Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/tradeai-frontend /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

#### Install SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d app.tradeai.gonxt.tech

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose: Redirect HTTP to HTTPS (option 2)

# Certbot will automatically:
# - Install SSL certificate
# - Update Nginx config
# - Set up auto-renewal
```

#### Verify SSL Auto-Renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

#### Update Nginx Config for HTTPS

Certbot will update your config, but verify it looks like this:

```bash
sudo nano /etc/nginx/sites-available/tradeai-frontend
```

Should now include:

```nginx
server {
    listen 443 ssl http2;
    server_name app.tradeai.gonxt.tech;
    
    ssl_certificate /etc/letsencrypt/live/app.tradeai.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.tradeai.gonxt.tech/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... rest of config
}

server {
    listen 80;
    server_name app.tradeai.gonxt.tech;
    return 301 https://$server_name$request_uri;
}
```

### Step 2B: Deploy to Vercel (Easier, Automatic SSL)

**Recommended if you want zero-config SSL!**

#### Install Vercel CLI

```bash
npm install -g vercel
```

#### Deploy

```bash
cd /workspace/project/TRADEAI/frontend-v3

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your team]
# - Link to existing project? No
# - What's your project's name? tradeai-frontend
# - In which directory is your code located? ./
# - Want to override settings? No
```

#### Add Custom Domain in Vercel

1. Go to: https://vercel.com/dashboard
2. Click your project: `tradeai-frontend`
3. Go to **Settings** > **Domains**
4. Add domain: `app.tradeai.gonxt.tech`
5. Vercel will show DNS records to add
6. Add the DNS records (usually CNAME)
7. Wait for DNS propagation
8. Vercel will automatically provision SSL certificate!

**DNS Record to Add**:
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### Step 2C: Deploy to Netlify (Also Easy, Automatic SSL)

#### Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Deploy

```bash
cd /workspace/project/TRADEAI/frontend-v3

# Build
npm run build

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist

# Follow prompts
# Netlify will give you a URL like: https://random-name.netlify.app
```

#### Add Custom Domain in Netlify

1. Go to: https://app.netlify.com
2. Click your site
3. Go to **Domain settings**
4. Click **Add custom domain**
5. Enter: `app.tradeai.gonxt.tech`
6. Netlify will show DNS records
7. Add the DNS records
8. Netlify will automatically provision SSL!

**DNS Record to Add**:
```
Type: CNAME
Name: app
Value: [your-site].netlify.app
```

---

## 🔧 Step 3: Update Backend CORS Configuration

Now that frontend will be at `https://app.tradeai.gonxt.tech`, update backend CORS:

### SSH into Backend Server

```bash
ssh -i /workspace/project/Vantax-2.pem ubuntu@tradeai.gonxt.tech
```

### Find Backend Code

```bash
# Common locations
cd /var/www/tradeai-backend
# or
cd /home/ubuntu/tradeai-backend
# or
cd /opt/tradeai-backend

# Find the main file
ls -la
# Look for: server.js, app.js, index.js, main.js
```

### Update CORS Configuration

```bash
# Backup current config
cp server.js server.js.backup

# Edit the file
nano server.js  # or vim server.js
```

**Find the CORS section and update**:

```javascript
const corsOptions = {
  origin: [
    'https://app.tradeai.gonxt.tech',           // NEW - Production frontend
    'https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev', // Testing
    'http://localhost:5173',                    // Development
    'http://localhost:12000',                   // Local production
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
```

### Restart Backend

```bash
# If using PM2
pm2 restart tradeai-backend

# If using systemd
sudo systemctl restart tradeai-backend

# If using supervisor
sudo supervisorctl restart tradeai-backend

# Verify it's running
pm2 status
# or
sudo systemctl status tradeai-backend
```

---

## 🧪 Step 4: Test Your Deployment

### Test Frontend

```bash
# Check if site is accessible
curl -I https://app.tradeai.gonxt.tech

# Should return: HTTP/2 200
```

**In Browser**:
1. Visit: `https://app.tradeai.gonxt.tech`
2. Should see login page with SSL padlock 🔒
3. No SSL warnings

### Test Backend CORS

**Open browser console on your frontend**:

```javascript
// Should work without CORS error
fetch('https://tradeai.gonxt.tech/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Test Authentication

1. Click "Quick Login" button
2. Should redirect to dashboard
3. Check browser console - no CORS errors
4. All API calls should work

### Test SSL Certificate

```bash
# Check SSL certificate
openssl s_client -connect app.tradeai.gonxt.tech:443 -servername app.tradeai.gonxt.tech

# Or use online tools:
# https://www.ssllabs.com/ssltest/
# Enter: app.tradeai.gonxt.tech
```

---

## 📊 Step 5: Set Up Monitoring

### UptimeRobot Setup (Free)

1. **Sign up**: https://uptimerobot.com/signUp

2. **Add Monitor #1** - Frontend
   - Type: HTTP(s)
   - Friendly Name: `TRADEAI Frontend (SSL)`
   - URL: `https://app.tradeai.gonxt.tech`
   - Interval: 5 minutes

3. **Add Monitor #2** - Backend
   - Type: HTTP(s)
   - Friendly Name: `TRADEAI Backend API`
   - URL: `https://tradeai.gonxt.tech/api/health`
   - Interval: 5 minutes

4. **Add Monitor #3** - SSL Certificate
   - Type: HTTP(s)
   - Friendly Name: `TRADEAI SSL Certificate`
   - URL: `https://app.tradeai.gonxt.tech`
   - Alert when: SSL expires
   - Advanced: Enable SSL certificate monitoring

5. **Configure Alerts**
   - Go to: My Settings > Alert Contacts
   - Add email: your-email@example.com
   - Verify email
   - Enable alerts: Down, Up, SSL Expiry

### Custom Monitoring Script

Update the monitoring script to use your custom domain:

```bash
cd /workspace/project/TRADEAI
nano scripts/monitor-health.js
```

**Update endpoints**:

```javascript
const CONFIG = {
  endpoints: [
    {
      name: 'Frontend Production (SSL)',
      url: 'https://app.tradeai.gonxt.tech',
      protocol: https,
      timeout: 10000,
    },
    {
      name: 'Frontend Health',
      url: 'https://app.tradeai.gonxt.tech/health',
      protocol: https,
      timeout: 5000,
    },
    {
      name: 'Backend API Health',
      url: 'https://tradeai.gonxt.tech/api/health',
      protocol: https,
      timeout: 5000,
    },
  ],
  // ... rest of config
};
```

**Run it**:

```bash
node scripts/monitor-health.js --interval=5
```

---

## 🔐 Step 6: Update Environment Variables

### Update Frontend Environment

**File**: `frontend-v3/.env.production`

```bash
# Production API URL
VITE_API_URL=https://tradeai.gonxt.tech/api

# Feature flags
VITE_USE_MOCK_DATA=false
VITE_ENABLE_DEV_TOOLS=false
VITE_ENABLE_HTTPS_ONLY=true

# Optional: Add Sentry, Analytics, etc.
# VITE_SENTRY_DSN=your-sentry-dsn
# VITE_GA_TRACKING_ID=your-ga-id
```

**Rebuild and redeploy**:

```bash
cd frontend-v3
npm run build

# If self-hosting: Upload new build
scp -i /workspace/project/Vantax-2.pem -r dist/* ubuntu@tradeai.gonxt.tech:/var/www/tradeai-frontend/

# If Vercel/Netlify: Just push to git or run vercel/netlify deploy again
```

---

## 🎨 Step 7: Update Branding (Optional)

### Update Document Title

**File**: `frontend-v3/index.html`

```html
<title>TRADEAI - Trade Promotion Management</title>
```

### Update Favicon

```bash
# Place your favicon files in public/
cp your-favicon.ico frontend-v3/public/favicon.ico
cp your-logo.png frontend-v3/public/logo.png
```

### Update Login Page

**File**: `frontend-v3/src/pages/auth/LoginPage.tsx`

Update any references to domain:

```typescript
// Update any hardcoded URLs if present
const API_URL = import.meta.env.VITE_API_URL || 'https://tradeai.gonxt.tech/api';
```

---

## 🚨 Troubleshooting

### Issue: DNS not resolving

**Check DNS propagation**:
```bash
nslookup app.tradeai.gonxt.tech
dig app.tradeai.gonxt.tech
```

**Wait time**: DNS can take 5 minutes to 48 hours

**Quick fix**: Flush DNS cache
```bash
# On your machine
sudo systemd-resolve --flush-caches  # Linux
dscacheutil -flushcache  # Mac
ipconfig /flushdns  # Windows
```

### Issue: SSL certificate not working

**Check certificate**:
```bash
sudo certbot certificates
```

**Renew certificate**:
```bash
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

### Issue: CORS errors after deployment

**Check backend CORS config** includes new domain:
```javascript
origin: [
  'https://app.tradeai.gonxt.tech',  // Make sure this is included!
  // ... other domains
]
```

**Restart backend**:
```bash
pm2 restart tradeai-backend
```

### Issue: 502 Bad Gateway

**Check backend is running**:
```bash
pm2 status
# or
sudo systemctl status tradeai-backend
```

**Check Nginx error logs**:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Issue: Mixed content (HTTP resources on HTTPS page)

**Check**: All API calls use HTTPS
```javascript
// Bad - will cause mixed content error
const API_URL = 'http://tradeai.gonxt.tech/api';

// Good
const API_URL = 'https://tradeai.gonxt.tech/api';
```

---

## ✅ Production Checklist

### DNS & Domain
- [ ] DNS A/CNAME record added
- [ ] DNS propagated (nslookup works)
- [ ] Domain accessible via browser

### SSL Certificate
- [ ] SSL certificate installed
- [ ] HTTPS redirect working
- [ ] No SSL warnings in browser
- [ ] SSL auto-renewal configured
- [ ] SSL grade A or better (test at ssllabs.com)

### Backend
- [ ] CORS updated with new domain
- [ ] Backend restarted
- [ ] Backend responding correctly
- [ ] API accessible from frontend

### Frontend
- [ ] Production build created
- [ ] Environment variables updated
- [ ] Frontend deployed to domain
- [ ] Static files loading correctly
- [ ] SPA routing working

### Testing
- [ ] Can access homepage
- [ ] Can login (Quick Login works)
- [ ] Dashboard loads
- [ ] All features working
- [ ] No console errors
- [ ] No CORS errors
- [ ] Mobile responsive

### Monitoring
- [ ] UptimeRobot monitors added
- [ ] Email alerts configured
- [ ] SSL monitoring enabled
- [ ] Custom monitoring script running

### Security
- [ ] HTTPS only (no HTTP)
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] No sensitive data in frontend
- [ ] Error messages don't leak info

---

## 📊 Performance Optimization

### Enable CDN (Cloudflare - Free)

1. **Sign up**: https://cloudflare.com
2. **Add site**: tradeai.gonxt.tech
3. **Update nameservers** at your domain registrar
4. **Enable**:
   - Auto minify (JS, CSS, HTML)
   - Brotli compression
   - HTTP/3
   - 0-RTT
   - Always Use HTTPS
5. **Page Rules**:
   - Cache everything: `app.tradeai.gonxt.tech/*`
   - Edge cache TTL: 1 day

### Enable Caching

Already configured in Nginx config above:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🎯 Summary

### What You've Accomplished

✅ **Custom Domain**: Frontend at `https://app.tradeai.gonxt.tech`  
✅ **SSL Certificate**: Free Let's Encrypt SSL with auto-renewal  
✅ **CORS Configured**: Backend allows frontend domain  
✅ **Monitoring**: UptimeRobot + custom scripts  
✅ **Production Ready**: All systems operational  

### Access Points

- **Frontend**: https://app.tradeai.gonxt.tech
- **Backend API**: https://tradeai.gonxt.tech/api
- **Health Check**: https://app.tradeai.gonxt.tech/health
- **Auth Test**: https://app.tradeai.gonxt.tech/test-auth.html

### Next Steps

1. ✅ Test with real users
2. ✅ Gather feedback
3. ✅ Monitor performance
4. ✅ Optimize as needed
5. ✅ Scale when ready

---

**Deployment Time**: 15-30 minutes (first time)  
**SSL Setup Time**: 5 minutes (automatic with Certbot)  
**Total Cost**: $0 (using free SSL and hosting)

**Status**: 🚀 **PRODUCTION DEPLOYED WITH SSL!**

---

**Last Updated**: 2025-10-31  
**Version**: 1.0.0  
**Domain**: app.tradeai.gonxt.tech  
**SSL**: Let's Encrypt (Free, Auto-renewing)
