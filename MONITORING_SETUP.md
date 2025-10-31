# 📊 Production Monitoring & Uptime Setup Guide

## 🎯 Overview

This guide covers setting up comprehensive monitoring for your TRADEAI production system, including:
- ✅ Uptime monitoring
- ✅ Health checks
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ Alert configuration

---

## 🚀 Quick Start: Free Monitoring Solutions

### 1. UptimeRobot (Recommended - Free Forever)

**Why UptimeRobot?**
- ✅ Completely free (50 monitors)
- ✅ 5-minute check intervals
- ✅ Email/SMS/Webhook alerts
- ✅ Status page included
- ✅ No credit card required

#### Setup Steps:

1. **Sign Up**: https://uptimerobot.com/signUp

2. **Add Monitor**:
   - Click "Add New Monitor"
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `TRADEAI Frontend`
   - URL: `https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev`
   - Monitoring Interval: `5 minutes`
   - Monitor Timeout: `30 seconds`

3. **Add Health Check**:
   - Click "Add New Monitor" again
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `TRADEAI Frontend Health`
   - URL: `http://localhost:12000/health` (or your public URL)
   - Monitoring Interval: `5 minutes`
   - Expected response: `200 OK`

4. **Add Backend Monitor**:
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `TRADEAI Backend API`
   - URL: `https://tradeai.gonxt.tech/api/health`
   - Monitoring Interval: `5 minutes`

5. **Configure Alerts**:
   - Go to "My Settings" > "Alert Contacts"
   - Add email: Your email address
   - Optional: Add phone for SMS (requires upgrade)
   - Optional: Add Slack webhook
   - Optional: Add Discord webhook

6. **Create Status Page** (Optional):
   - Go to "Status Pages" tab
   - Click "Add New Status Page"
   - Select your monitors
   - Customize design
   - Publish and share URL with users

---

### 2. Better Uptime (Free Tier Available)

**Features**:
- ✅ 10 monitors free
- ✅ 3-minute check intervals
- ✅ Beautiful status pages
- ✅ Incident management
- ✅ On-call scheduling

#### Setup:

1. **Sign Up**: https://betteruptime.com

2. **Create Monitor**:
   ```
   Name: TRADEAI Frontend
   URL: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev
   Method: GET
   Expected Status: 200
   Check Frequency: 3 minutes
   ```

3. **Add Health Check Endpoint**:
   ```
   Name: TRADEAI Health Check
   URL: http://localhost:12000/health
   Expected Body: Contains "ok"
   ```

---

### 3. Pingdom (Free Trial, Paid After)

**Features**:
- ✅ Real user monitoring
- ✅ Transaction monitoring
- ✅ Page speed insights
- ✅ Global checkpoints

#### Basic Setup:

1. **Sign Up**: https://www.pingdom.com

2. **Add Uptime Check**:
   - Monitor Type: Uptime
   - URL: `https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev`
   - Check Interval: 1 minute
   - Alert When: Down, Slow

---

## 🔔 Advanced Monitoring Solutions

### 4. Sentry (Error Tracking)

**Perfect for**: Tracking JavaScript errors, API errors, performance issues

#### Frontend Setup:

```bash
cd frontend-v3
npm install --save @sentry/react @sentry/tracing
```

**File**: `frontend-v3/src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import App from './App'
import './index.css'

// Initialize Sentry (only in production)
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new BrowserTracing(),
    ],
    environment: import.meta.env.MODE,
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    
    // Filter out noise
    beforeSend(event) {
      // Don't send events from development
      if (window.location.hostname === 'localhost') {
        return null;
      }
      return event;
    },
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div>An error occurred</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
```

**Add to `.env.production`**:
```bash
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

#### Sentry Setup Steps:

1. **Sign Up**: https://sentry.io/signup
2. **Create Project**: Choose "React"
3. **Copy DSN**: Add to `.env.production`
4. **Rebuild**: `npm run build`
5. **Deploy**: Your errors will now be tracked!

---

### 5. Google Analytics (Usage Analytics)

Track user behavior, page views, and interactions.

**File**: `frontend-v3/index.html` (add to `<head>`)

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

**Or use React package**:

```bash
npm install react-ga4
```

```typescript
// src/main.tsx
import ReactGA from 'react-ga4';

if (import.meta.env.PROD) {
  ReactGA.initialize('GA_MEASUREMENT_ID');
}

// Track page views
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function usePageTracking() {
  const location = useLocation();
  
  useEffect(() => {
    if (import.meta.env.PROD) {
      ReactGA.send({ hitType: 'pageview', page: location.pathname });
    }
  }, [location]);
}
```

---

### 6. LogRocket (Session Replay)

See exactly what users see when issues occur.

```bash
npm install logrocket
```

```typescript
// src/main.tsx
import LogRocket from 'logrocket';

if (import.meta.env.PROD) {
  LogRocket.init('your-app-id/project-name');
}
```

---

## 🏥 Health Check Endpoint

Your production server already includes a health check endpoint!

**Endpoint**: `http://localhost:12000/health`

**Response**:
```json
{
  "status": "ok",
  "service": "TRADEAI Frontend",
  "timestamp": "2025-10-31T11:20:30.611Z",
  "uptime": 310.549438527
}
```

### Enhanced Health Check

Add more details to your health check by updating `server.cjs`:

```javascript
// Health check endpoint with more details
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    service: 'TRADEAI Frontend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    env: process.env.NODE_ENV || 'development',
  };
  
  // Check backend connectivity
  try {
    const backendHealth = await fetch('https://tradeai.gonxt.tech/api/health');
    health.backend = {
      status: backendHealth.ok ? 'healthy' : 'unhealthy',
      statusCode: backendHealth.status,
    };
  } catch (error) {
    health.backend = {
      status: 'error',
      error: error.message,
    };
  }
  
  res.json(health);
});
```

---

## 📈 Monitoring Dashboards

### 1. Simple Status Page (HTML)

Create `frontend-v3/dist/status.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TRADEAI System Status</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="max-w-4xl mx-auto p-8">
        <h1 class="text-3xl font-bold mb-8">🟢 TRADEAI System Status</h1>
        
        <div class="space-y-4">
            <div class="bg-white p-6 rounded-lg shadow" id="frontend-status">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-xl font-semibold">Frontend Application</h2>
                        <p class="text-gray-600">Main web application</p>
                    </div>
                    <div class="text-2xl">⏳</div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow" id="backend-status">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-xl font-semibold">Backend API</h2>
                        <p class="text-gray-600">API Server</p>
                    </div>
                    <div class="text-2xl">⏳</div>
                </div>
            </div>
        </div>
        
        <div class="mt-8 text-center text-sm text-gray-500">
            Last checked: <span id="last-checked">Never</span>
        </div>
    </div>
    
    <script>
        async function checkStatus() {
            const now = new Date().toLocaleTimeString();
            document.getElementById('last-checked').textContent = now;
            
            // Check frontend health
            try {
                const res = await fetch('/health');
                const data = await res.json();
                updateStatus('frontend-status', true, `Uptime: ${Math.round(data.uptime)}s`);
            } catch (error) {
                updateStatus('frontend-status', false, error.message);
            }
            
            // Check backend health
            try {
                const res = await fetch('https://tradeai.gonxt.tech/api/health');
                const data = await res.json();
                updateStatus('backend-status', true, `Status: ${data.status}`);
            } catch (error) {
                updateStatus('backend-status', false, error.message);
            }
        }
        
        function updateStatus(elementId, isHealthy, message) {
            const element = document.getElementById(elementId);
            const statusIcon = element.querySelector('.text-2xl');
            const description = element.querySelector('.text-gray-600');
            
            if (isHealthy) {
                statusIcon.textContent = '✅';
                description.textContent = message;
                element.classList.remove('border-red-500');
                element.classList.add('border-green-500', 'border-l-4');
            } else {
                statusIcon.textContent = '❌';
                description.textContent = `Error: ${message}`;
                element.classList.remove('border-green-500');
                element.classList.add('border-red-500', 'border-l-4');
            }
        }
        
        // Check immediately and then every 30 seconds
        checkStatus();
        setInterval(checkStatus, 30000);
    </script>
</body>
</html>
```

Access at: `http://localhost:12000/status.html`

---

## 🔔 Alert Configuration

### Email Alerts

Most monitoring services support email alerts. Configure:

1. **UptimeRobot**:
   - Settings > Alert Contacts > Add Email
   - Verify email address
   - Select "Alert When Down, Up, SSL Expiry"

2. **Custom Email Alerts** (Node.js backend):

```javascript
// Install nodemailer
// npm install nodemailer

const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Function to send alert
async function sendAlert(subject, message) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'admin@yourcompany.com',
    subject: `[TRADEAI Alert] ${subject}`,
    html: `
      <h2>${subject}</h2>
      <p>${message}</p>
      <p>Time: ${new Date().toISOString()}</p>
    `,
  });
}

// Monitor health and send alerts
setInterval(async () => {
  try {
    const response = await fetch('https://tradeai.gonxt.tech/api/health');
    if (!response.ok) {
      await sendAlert('Backend Down', `Backend returned status ${response.status}`);
    }
  } catch (error) {
    await sendAlert('Backend Unreachable', error.message);
  }
}, 5 * 60 * 1000); // Check every 5 minutes
```

---

### Slack Alerts

1. **Create Slack Incoming Webhook**:
   - Go to: https://api.slack.com/messaging/webhooks
   - Create new app
   - Enable Incoming Webhooks
   - Add to workspace
   - Copy webhook URL

2. **Send alerts to Slack**:

```javascript
async function sendSlackAlert(message) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 TRADEAI Alert`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Alert:* ${message}\n*Time:* ${new Date().toISOString()}`,
          },
        },
      ],
    }),
  });
}
```

---

### Discord Alerts

```javascript
async function sendDiscordAlert(message) {
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🚨 **TRADEAI Alert**\n${message}\nTime: ${new Date().toISOString()}`,
    }),
  });
}
```

---

## 📊 Monitoring Metrics

### Key Metrics to Track

1. **Uptime**
   - Target: 99.9% (43 minutes downtime/month)
   - Monitor: Frontend, Backend, Database

2. **Response Time**
   - Frontend: < 2 seconds
   - API calls: < 500ms
   - Monitor: 95th percentile

3. **Error Rate**
   - Target: < 1% of requests
   - Monitor: 4xx and 5xx errors

4. **CPU & Memory Usage**
   - Target: < 70% average
   - Alert: > 85%

5. **Disk Space**
   - Target: < 75% used
   - Alert: > 85%

---

## 🛠️ Custom Monitoring Script

Create a simple monitoring script:

**File**: `frontend-v3/monitor.js`

```javascript
#!/usr/bin/env node

const https = require('https');
const http = require('http');

const ENDPOINTS = [
  {
    name: 'Frontend Health',
    url: 'http://localhost:12000/health',
    protocol: http,
  },
  {
    name: 'Backend Health',
    url: 'https://tradeai.gonxt.tech/api/health',
    protocol: https,
  },
];

async function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    endpoint.protocol.get(endpoint.url, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          name: endpoint.name,
          status: res.statusCode,
          duration,
          healthy: res.statusCode === 200,
        });
      });
    }).on('error', (error) => {
      resolve({
        name: endpoint.name,
        status: 0,
        duration: Date.now() - startTime,
        healthy: false,
        error: error.message,
      });
    });
  });
}

async function monitor() {
  console.log(`\n🔍 Monitoring TRADEAI - ${new Date().toLocaleString()}`);
  console.log('═'.repeat(60));
  
  for (const endpoint of ENDPOINTS) {
    const result = await checkEndpoint(endpoint);
    
    const icon = result.healthy ? '✅' : '❌';
    const status = result.healthy ? 'UP' : 'DOWN';
    const details = result.error || `${result.duration}ms`;
    
    console.log(`${icon} ${result.name}: ${status} (${details})`);
  }
  
  console.log('═'.repeat(60));
}

// Run immediately
monitor();

// Run every 5 minutes
setInterval(monitor, 5 * 60 * 1000);

console.log('📊 TRADEAI Monitor Started');
console.log('Checking every 5 minutes...');
console.log('Press Ctrl+C to stop\n');
```

**Run it**:
```bash
node frontend-v3/monitor.js
```

**Run in background**:
```bash
nohup node frontend-v3/monitor.js > monitor.log 2>&1 &
```

---

## ✅ Monitoring Setup Checklist

### Immediate Setup (5 minutes)

- [ ] Sign up for UptimeRobot (free)
- [ ] Add frontend monitor
- [ ] Add backend monitor
- [ ] Configure email alerts
- [ ] Test alerts (pause monitor to trigger alert)

### Enhanced Setup (30 minutes)

- [ ] Install Sentry for error tracking
- [ ] Add Google Analytics for usage tracking
- [ ] Create status page
- [ ] Set up Slack/Discord alerts
- [ ] Deploy monitoring script

### Advanced Setup (Optional)

- [ ] Set up LogRocket for session replay
- [ ] Configure custom dashboards
- [ ] Set up anomaly detection
- [ ] Create runbooks for common issues
- [ ] Document escalation procedures

---

## 📞 Incident Response

### When You Get an Alert:

1. **Check Status**
   - Visit status page
   - Check if it's frontend or backend
   - Check if it's partial or complete outage

2. **Investigate**
   ```bash
   # Check if server is running
   ps aux | grep node
   
   # Check logs
   pm2 logs
   # OR
   tail -f /var/log/tradeai/error.log
   
   # Check system resources
   top
   df -h
   ```

3. **Quick Fixes**
   ```bash
   # Restart application
   pm2 restart tradeai-frontend
   
   # Clear cache
   pm2 flush
   
   # Check health
   curl http://localhost:12000/health
   ```

4. **Document**
   - What happened
   - When it happened
   - What fixed it
   - How to prevent it

---

## 🎯 Summary

### Recommended Free Setup:

1. **UptimeRobot**: Uptime monitoring (free, 5-min checks)
2. **Sentry** (free tier): Error tracking
3. **Google Analytics** (free): Usage analytics
4. **Custom health check**: `/health` endpoint

### Recommended Paid Setup:

1. **Better Uptime** ($20/mo): Professional uptime monitoring
2. **Sentry** ($26/mo): Full error tracking
3. **LogRocket** ($99/mo): Session replay
4. **Datadog/New Relic** ($15+/mo): Full observability

---

**Total Setup Time**: 
- Basic (free): 5-10 minutes ✅
- Enhanced: 30-60 minutes
- Advanced: 2-3 hours

**Cost**:
- Free tier: $0/month (good for startups)
- Professional: $50-200/month (recommended for production)

---

**Last Updated**: 2025-10-31  
**Status**: Ready to implement  
**Priority**: HIGH (recommended before production launch)
