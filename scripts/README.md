# 🛠️ TRADEAI Monitoring Scripts

## 📋 Overview

This directory contains monitoring and maintenance scripts for the TRADEAI production system.

---

## 📊 monitor-health.js

Health monitoring script that checks the status of frontend and backend services.

### Features

- ✅ Monitors frontend health endpoint
- ✅ Monitors backend API health
- ✅ Monitors main frontend page
- ✅ Logs results to file
- ✅ Console output with colors
- ✅ Tracks consecutive failures
- ✅ Alert system (configurable)
- ✅ Can run as daemon

### Usage

#### Run once (immediate check)

```bash
node scripts/monitor-health.js
```

#### Run continuously (every 5 minutes)

```bash
node scripts/monitor-health.js --interval=5
```

#### Run as background daemon

```bash
node scripts/monitor-health.js --interval=5 --daemon > /dev/null 2>&1 &
```

#### Using PM2 (recommended for production)

```bash
# Install PM2 globally
npm install -g pm2

# Start monitor with PM2
pm2 start scripts/monitor-health.js --name "tradeai-monitor" -- --interval=5

# View status
pm2 status

# View logs
pm2 logs tradeai-monitor

# Stop
pm2 stop tradeai-monitor

# Make it start on system boot
pm2 startup
pm2 save
```

### Configuration

Edit the `CONFIG` object in `monitor-health.js`:

```javascript
const CONFIG = {
  endpoints: [
    // Add or modify endpoints
    {
      name: 'Your Endpoint',
      url: 'https://your-url.com',
      protocol: https,
      timeout: 5000,
    },
  ],
  logFile: path.join(__dirname, '../logs/monitor.log'),
  alertThreshold: 3, // Alert after N consecutive failures
};
```

### Log Files

Logs are stored in: `logs/monitor.log`

View recent logs:
```bash
tail -f logs/monitor.log
```

View last 50 lines:
```bash
tail -n 50 logs/monitor.log
```

### Output Example

```
🚀 TRADEAI Health Monitor Started
📝 Logging to: /workspace/project/TRADEAI/logs/monitor.log

════════════════════════════════════════════════════════════════════════════════
🔍 Health Check - 10/31/2025, 11:39:20 AM
════════════════════════════════════════════════════════════════════════════════
✅ Frontend Health: UP (12ms)
    {
      "status": "ok",
      "service": "TRADEAI Frontend",
      "uptime": 1141.828891427
    }
✅ Backend API Health: UP (402ms)
    {
      "status": "ok",
      "uptime": 57204,
      "environment": "production"
    }
✅ Frontend Main Page: UP (27ms)
════════════════════════════════════════════════════════════════════════════════
📊 Current Uptime: 100.00% (3/3 services healthy)
```

### Alert System

The script tracks consecutive failures. After reaching the threshold (default: 3), it will:
1. Log an alert message
2. Call the `sendAlert()` function

**Implement custom alerts** by editing the `sendAlert()` function:

```javascript
function sendAlert(endpoint, failures) {
  const message = `🚨 ALERT: ${endpoint.name} has failed ${failures} times!`;
  
  // Example: Send email
  // sendEmail(message);
  
  // Example: Send Slack message
  // sendSlackMessage(message);
  
  // Example: Send webhook
  // fetch('https://your-webhook-url.com', {
  //   method: 'POST',
  //   body: JSON.stringify({ message }),
  // });
}
```

---

## 🔧 Maintenance Commands

### Stop all monitors

```bash
# If using PM2
pm2 stop all

# If running in background
pkill -f "monitor-health.js"
```

### View monitor status

```bash
pm2 status
```

### Restart monitors

```bash
pm2 restart tradeai-monitor
```

### View real-time logs

```bash
pm2 logs tradeai-monitor --lines 100
```

---

## 📁 Directory Structure

```
scripts/
├── README.md              # This file
├── monitor-health.js      # Health monitoring script
└── [future scripts]

logs/
├── monitor.log           # Health check logs
└── [other logs]
```

---

## 🚀 Quick Start (Production)

### 1. Install PM2

```bash
npm install -g pm2
```

### 2. Start monitoring

```bash
pm2 start scripts/monitor-health.js \
  --name "tradeai-monitor" \
  -- --interval=5
```

### 3. Save PM2 configuration

```bash
pm2 save
```

### 4. Enable startup on boot

```bash
pm2 startup
# Follow the instructions printed
```

### 5. Verify it's running

```bash
pm2 status
pm2 logs tradeai-monitor
```

---

## 📊 Monitoring Best Practices

### Check Intervals

- **Development**: 5-10 minutes
- **Staging**: 2-5 minutes
- **Production**: 1-3 minutes

### Alert Thresholds

- **Critical services**: 2-3 failures
- **Non-critical services**: 5 failures
- **Low priority**: 10 failures

### Log Rotation

Prevent log files from growing too large:

```bash
# Install logrotate configuration
sudo tee /etc/logrotate.d/tradeai-monitor << EOF
/path/to/logs/monitor.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
EOF
```

---

## 🔗 Integration Examples

### Slack Webhook

```javascript
async function sendSlackAlert(message) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 TRADEAI Alert`,
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      }],
    }),
  });
}
```

### Email (using Nodemailer)

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendEmailAlert(message) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'admin@yourcompany.com',
    subject: '[TRADEAI] Service Alert',
    text: message,
  });
}
```

### Discord Webhook

```javascript
async function sendDiscordAlert(message) {
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🚨 **TRADEAI Alert**\n${message}`,
    }),
  });
}
```

---

## 📞 Troubleshooting

### Script not running

```bash
# Check if process is running
ps aux | grep monitor-health

# Check PM2 status
pm2 status

# View error logs
pm2 logs tradeai-monitor --err
```

### Logs not being created

```bash
# Check if logs directory exists
ls -la logs/

# Create if missing
mkdir -p logs/

# Check permissions
chmod 755 logs/
```

### Network errors

```bash
# Test endpoints manually
curl http://localhost:12000/health
curl https://tradeai.gonxt.tech/api/health
curl https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev
```

---

## 📚 Related Documentation

- **MONITORING_SETUP.md** - Complete monitoring guide
- **BACKEND_CORS_SETUP.md** - CORS configuration
- **PRODUCTION_READY_FINAL.md** - Production deployment guide
- **QUICK_SETUP_GUIDE.md** - Quick setup instructions

---

## 🎯 Next Steps

1. ✅ Test the monitoring script
2. ✅ Set up PM2 to run it continuously
3. ⏳ Implement custom alert mechanism
4. ⏳ Set up external monitoring (UptimeRobot)
5. ⏳ Configure log rotation

---

**Last Updated**: 2025-10-31  
**Version**: 1.0.0  
**Maintainer**: TRADEAI Team
