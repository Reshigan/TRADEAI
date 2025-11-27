# Monitoring & Alerting Setup Guide - TRADEAI

**Priority:** 🔴 CRITICAL - P0  
**Estimated Time:** 4-6 hours  
**Status:** Not Started

---

## Overview

This guide provides step-by-step instructions for setting up production monitoring and alerting for TRADEAI. This is the **highest priority** item from the go-live readiness assessment.

**Why This Matters:**
- Without monitoring, production issues will go unnoticed
- Outages won't trigger alerts
- No visibility into errors or performance degradation
- Users will report issues before you know about them

---

## 1. Error Tracking with Sentry

**Estimated Time:** 2-3 hours

### 1.1 Create Sentry Account

1. Go to https://sentry.io
2. Sign up for free account (or use existing account)
3. Create new project for TRADEAI
   - Choose "React" for frontend project
   - Choose "Express" for backend project

### 1.2 Install Sentry SDK - Frontend

```bash
cd /home/ubuntu/repos/TRADEAI/frontend
npm install @sentry/react @sentry/tracing
```

### 1.3 Configure Sentry - Frontend

Create `frontend/src/sentry.js`:

```javascript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function initSentry() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Environment
      environment: process.env.NODE_ENV,
      
      // Release tracking
      release: `tradeai-frontend@${process.env.REACT_APP_VERSION || '1.1.6'}`,
      
      // Error filtering
      beforeSend(event, hint) {
        // Filter out non-critical errors
        if (event.exception) {
          const error = hint.originalException;
          // Don't send network errors for now (too noisy)
          if (error && error.message && error.message.includes('NetworkError')) {
            return null;
          }
        }
        return event;
      },
    });
  }
}
```

Update `frontend/src/index.js`:

```javascript
import { initSentry } from './sentry';

// Initialize Sentry BEFORE React
initSentry();

// ... rest of your code
```

Add to `frontend/.env.production`:

```bash
REACT_APP_SENTRY_DSN=https://YOUR_SENTRY_DSN@sentry.io/PROJECT_ID
REACT_APP_VERSION=1.1.6
```

### 1.4 Install Sentry SDK - Backend

```bash
cd /home/ubuntu/repos/TRADEAI/backend
npm install @sentry/node @sentry/tracing
```

### 1.5 Configure Sentry - Backend

Update `backend/src/app.js` (add at the very top):

```javascript
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

// Initialize Sentry FIRST
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app }),
      new Tracing.Integrations.Mongo(),
    ],
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    release: `tradeai-backend@${process.env.npm_package_version || '2.1.3'}`,
  });
}

// ... rest of your Express setup

// Add Sentry request handler AFTER all controllers
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... your routes

// Add Sentry error handler BEFORE other error handlers
app.use(Sentry.Handlers.errorHandler());
```

Add to `backend/.env.production`:

```bash
SENTRY_DSN=https://YOUR_SENTRY_DSN@sentry.io/PROJECT_ID
```

### 1.6 Configure Alerts

In Sentry dashboard:

1. Go to **Alerts** → **Create Alert**
2. Create alert for:
   - **High Error Rate:** > 10 errors/minute
   - **New Issue:** Any new error type
   - **Regression:** Previously resolved error returns
3. Configure notifications:
   - Email: your-team@gonxt.tech
   - Slack: #tradeai-alerts (if available)
   - PagerDuty: (if using on-call rotation)

### 1.7 Test Sentry

**Frontend Test:**
```javascript
// Add temporary test button
<button onClick={() => { throw new Error("Sentry Test Error"); }}>
  Test Sentry
</button>
```

**Backend Test:**
```bash
curl -X POST https://tradeai.gonxt.tech/api/test-error
```

Check Sentry dashboard for errors within 1-2 minutes.

---

## 2. Uptime Monitoring

**Estimated Time:** 30 minutes

### 2.1 Choose Service

**Recommended Options:**
- **UptimeRobot** (Free, easy): https://uptimerobot.com
- **Pingdom** (Paid, advanced): https://pingdom.com
- **Better Uptime** (Modern, good UX): https://betteruptime.com

### 2.2 Setup with UptimeRobot (Free)

1. Sign up at https://uptimerobot.com
2. Create monitors:

**Monitor 1: Frontend Health**
- Type: HTTP(s)
- URL: https://tradeai.gonxt.tech/health.json
- Interval: 5 minutes
- Alert when: Down

**Monitor 2: Backend API Health**
- Type: HTTP(s)
- URL: https://tradeai.gonxt.tech/api/health
- Interval: 5 minutes
- Alert when: Down

**Monitor 3: Backend API Response Time**
- Type: HTTP(s)
- URL: https://tradeai.gonxt.tech/api/health
- Interval: 5 minutes
- Alert when: Response time > 2000ms

3. Configure alert contacts:
   - Email: your-team@gonxt.tech
   - SMS: (optional, for critical alerts)
   - Webhook: (optional, for Slack integration)

### 2.3 Test Uptime Monitoring

1. Temporarily stop backend server
2. Wait 5 minutes
3. Verify you receive alert
4. Restart server
5. Verify you receive recovery notification

---

## 3. Log Aggregation

**Estimated Time:** 2-3 hours

### 3.1 Choose Service

**Recommended Options:**
- **Logtail** (Easy, affordable): https://logtail.com
- **AWS CloudWatch** (If using AWS): Built-in
- **Datadog** (Enterprise): https://datadoghq.com
- **ELK Stack** (Self-hosted): Elasticsearch + Logstash + Kibana

### 3.2 Setup with Logtail (Recommended)

1. Sign up at https://logtail.com
2. Create source for "Node.js"
3. Install Logtail SDK:

```bash
cd /home/ubuntu/repos/TRADEAI/backend
npm install @logtail/node @logtail/winston
```

4. Update backend logging:

Create `backend/src/utils/logger.js`:

```javascript
const winston = require('winston');
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'tradeai-backend',
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  },
  transports: [
    // Console (for local development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Logtail (for production)
    ...(process.env.NODE_ENV === 'production' ? [
      new LogtailTransport(logtail)
    ] : [])
  ]
});

module.exports = logger;
```

5. Replace console.log with logger:

```javascript
// Before
console.log('Server started');
console.error('Database error:', error);

// After
const logger = require('./utils/logger');
logger.info('Server started');
logger.error('Database error', { error: error.message, stack: error.stack });
```

6. Add to `backend/.env.production`:

```bash
LOGTAIL_SOURCE_TOKEN=your_logtail_token_here
LOG_LEVEL=info
```

### 3.3 Configure Log-Based Alerts

In Logtail dashboard:

1. Go to **Alerts** → **Create Alert**
2. Create alerts for:
   - **Error Rate:** > 10 errors/minute
   - **Database Connection Failures:** Any log with "MongoDB connection error"
   - **Authentication Failures:** > 20 failed logins/minute
3. Configure notifications (email, Slack, webhook)

---

## 4. Application Performance Monitoring (Optional but Recommended)

**Estimated Time:** 1-2 hours

### 4.1 New Relic APM (Free Tier Available)

1. Sign up at https://newrelic.com
2. Install New Relic agent:

```bash
cd /home/ubuntu/repos/TRADEAI/backend
npm install newrelic
```

3. Create `backend/newrelic.js`:

```javascript
'use strict'

exports.config = {
  app_name: ['TRADEAI Backend'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  }
}
```

4. Update `backend/src/server.js` (add at very top):

```javascript
// Must be first require
if (process.env.NODE_ENV === 'production') {
  require('newrelic');
}
```

5. Add to `backend/.env.production`:

```bash
NEW_RELIC_LICENSE_KEY=your_license_key_here
```

---

## 5. Deployment Steps

### 5.1 Update Environment Variables

**On Production Server:**

```bash
# SSH into production server
ssh -i ~/.ssh/tradeai.pem ubuntu@your-server-ip

# Update backend .env
sudo nano /path/to/backend/.env.production

# Add:
SENTRY_DSN=https://...
LOGTAIL_SOURCE_TOKEN=...
NEW_RELIC_LICENSE_KEY=...
LOG_LEVEL=info

# Update frontend .env (rebuild required)
sudo nano /path/to/frontend/.env.production

# Add:
REACT_APP_SENTRY_DSN=https://...
REACT_APP_VERSION=1.1.6
```

### 5.2 Rebuild and Deploy

```bash
# Frontend
cd /home/ubuntu/repos/TRADEAI/frontend
npm run build
sudo rsync -av dist/ /var/www/tradeai/

# Backend (restart with new env vars)
cd /home/ubuntu/repos/TRADEAI/backend
pm2 restart tradeai-backend --update-env
```

### 5.3 Verify Monitoring

1. **Check Sentry:** Generate test error, verify it appears in dashboard
2. **Check Uptime:** Verify monitors are green
3. **Check Logs:** Verify logs flowing to Logtail
4. **Check APM:** Verify transactions appearing in New Relic

---

## 6. Monitoring Dashboard

### 6.1 Create Status Page (Optional)

Use **StatusPage.io** or **Better Uptime** to create public status page:
- https://status.tradeai.gonxt.tech
- Shows uptime, incidents, scheduled maintenance

### 6.2 Internal Dashboard

Create internal monitoring dashboard showing:
- Sentry error rate (last 24h)
- Uptime percentage (last 30 days)
- API response times (p50, p95, p99)
- Active users
- Database connection status

---

## 7. Runbook for Common Issues

### Issue: High Error Rate Alert

1. Check Sentry dashboard for error details
2. Check Logtail for context around errors
3. Check server resources (CPU, memory, disk)
4. Check database connection
5. If critical: rollback to previous version
6. If non-critical: create bug ticket

### Issue: Downtime Alert

1. SSH into server: `ssh -i ~/.ssh/tradeai.pem ubuntu@server-ip`
2. Check backend status: `pm2 status`
3. Check backend logs: `pm2 logs tradeai-backend --lines 100`
4. Check nginx status: `sudo systemctl status nginx`
5. Check nginx logs: `sudo tail -100 /var/log/nginx/tradeai-error.log`
6. Restart services if needed:
   ```bash
   pm2 restart tradeai-backend
   sudo systemctl restart nginx
   ```

### Issue: Slow Response Times

1. Check New Relic APM for slow transactions
2. Check database query performance
3. Check server resources
4. Check for long-running queries in MongoDB
5. Consider adding database indexes
6. Consider scaling horizontally

---

## 8. Checklist

### Setup Complete When:

- [ ] Sentry configured for frontend and backend
- [ ] Sentry alerts configured and tested
- [ ] Uptime monitoring configured for 3 endpoints
- [ ] Uptime alerts configured and tested
- [ ] Log aggregation configured
- [ ] Log-based alerts configured
- [ ] APM configured (optional)
- [ ] Environment variables updated on production
- [ ] Frontend rebuilt with Sentry
- [ ] Backend restarted with new env vars
- [ ] All monitoring verified working
- [ ] Team trained on monitoring tools
- [ ] Runbook documented and shared

---

## 9. Costs

**Free Tier Options:**
- Sentry: 5,000 errors/month free
- UptimeRobot: 50 monitors free
- Logtail: 1GB logs/month free
- New Relic: 100GB data/month free

**Total Monthly Cost (Free Tier):** $0

**Paid Tier (Recommended for Production):**
- Sentry Team: $26/month
- Better Uptime: $18/month
- Logtail Pro: $29/month
- New Relic Pro: $99/month

**Total Monthly Cost (Paid):** ~$172/month

---

## 10. Next Steps After Setup

1. **Week 1:** Monitor closely, tune alert thresholds
2. **Week 2:** Review error patterns, fix top 10 errors
3. **Week 3:** Set up automated weekly reports
4. **Week 4:** Review and optimize monitoring costs

---

## Support

**Questions?**
- Sentry Docs: https://docs.sentry.io
- UptimeRobot Docs: https://uptimerobot.com/help
- Logtail Docs: https://logtail.com/docs
- New Relic Docs: https://docs.newrelic.com

**Need Help?**
Contact: reshigan@gonxt.tech
