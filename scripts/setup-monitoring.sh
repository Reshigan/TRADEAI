#!/bin/bash

###############################################################################
# TRADEAI Enterprise - Monitoring Setup Script
# Sets up comprehensive system monitoring and alerting
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║       TRADEAI Enterprise - Monitoring Setup            ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}✗ This script must be run as root or with sudo${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Running with appropriate privileges${NC}"
echo ""

# 1. PM2 Monitoring
echo -e "${BLUE}═══ Setting up PM2 Monitoring ═══${NC}"
echo ""

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠ Installing PM2...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}"
fi

# Configure PM2 monitoring
echo -e "${YELLOW}⚠ Configuring PM2 monitoring...${NC}"

# Create PM2 monitoring config
cat > /opt/tradeai/pm2-monitoring.json << 'EOF'
{
  "apps": [
    {
      "name": "tradeai-monitor",
      "script": "/opt/tradeai/monitoring/monitoring_service.py",
      "interpreter": "python3",
      "instances": 1,
      "exec_mode": "fork",
      "max_memory_restart": "500M",
      "error_file": "/opt/tradeai/logs/monitor-error.log",
      "out_file": "/opt/tradeai/logs/monitor-out.log",
      "merge_logs": true,
      "time": true,
      "env": {
        "MONITORING_PORT": "8080",
        "CHECK_INTERVAL": "60",
        "ALERT_EMAIL": "alerts@tradeai.com"
      }
    }
  ]
}
EOF

echo -e "${GREEN}✓ PM2 monitoring configured${NC}"

# 2. System Health Checks
echo ""
echo -e "${BLUE}═══ Setting up Health Checks ═══${NC}"
echo ""

# Create health check script
cat > /opt/tradeai/scripts/health-check.sh << 'EOF'
#!/bin/bash

# TRADEAI Health Check Script

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/opt/tradeai/logs/health-check.log"

echo "[$TIMESTAMP] Running health check..." >> $LOG_FILE

# Check backend API
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$BACKEND_STATUS" == "200" ]; then
    echo "[$TIMESTAMP] ✓ Backend API: Healthy" >> $LOG_FILE
else
    echo "[$TIMESTAMP] ✗ Backend API: Unhealthy (Status: $BACKEND_STATUS)" >> $LOG_FILE
    # Send alert
    echo "Backend API is down!" | mail -s "TRADEAI Alert: Backend Down" alerts@tradeai.com
fi

# Check MongoDB
if mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "[$TIMESTAMP] ✓ MongoDB: Healthy" >> $LOG_FILE
else
    echo "[$TIMESTAMP] ✗ MongoDB: Unhealthy" >> $LOG_FILE
    echo "MongoDB is down!" | mail -s "TRADEAI Alert: MongoDB Down" alerts@tradeai.com
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "[$TIMESTAMP] ✓ Redis: Healthy" >> $LOG_FILE
else
    echo "[$TIMESTAMP] ✗ Redis: Unhealthy" >> $LOG_FILE
    echo "Redis is down!" | mail -s "TRADEAI Alert: Redis Down" alerts@tradeai.com
fi

# Check disk space
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "[$TIMESTAMP] ⚠ Disk Usage: ${DISK_USAGE}% (Warning)" >> $LOG_FILE
    echo "Disk usage is at ${DISK_USAGE}%" | mail -s "TRADEAI Alert: High Disk Usage" alerts@tradeai.com
else
    echo "[$TIMESTAMP] ✓ Disk Usage: ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -gt 85 ]; then
    echo "[$TIMESTAMP] ⚠ Memory Usage: ${MEM_USAGE}% (Warning)" >> $LOG_FILE
else
    echo "[$TIMESTAMP] ✓ Memory Usage: ${MEM_USAGE}%" >> $LOG_FILE
fi

echo "[$TIMESTAMP] Health check completed" >> $LOG_FILE
echo "" >> $LOG_FILE
EOF

chmod +x /opt/tradeai/scripts/health-check.sh
echo -e "${GREEN}✓ Health check script created${NC}"

# 3. Cron Jobs
echo ""
echo -e "${BLUE}═══ Setting up Cron Jobs ═══${NC}"
echo ""

# Add cron jobs for monitoring
(crontab -l 2>/dev/null; echo "# TRADEAI Monitoring Jobs") | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/tradeai/scripts/health-check.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/tradeai/scripts/backup-mongodb.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 */6 * * * /opt/tradeai/scripts/cleanup-logs.sh") | crontab -

echo -e "${GREEN}✓ Cron jobs configured:${NC}"
echo "  • Health checks: Every 5 minutes"
echo "  • Database backup: Daily at 2 AM"
echo "  • Log cleanup: Every 6 hours"

# 4. Log Rotation
echo ""
echo -e "${BLUE}═══ Setting up Log Rotation ═══${NC}"
echo ""

cat > /etc/logrotate.d/tradeai << 'EOF'
/opt/tradeai/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

echo -e "${GREEN}✓ Log rotation configured (14 days retention)${NC}"

# 5. Alert Configuration
echo ""
echo -e "${BLUE}═══ Configuring Alerts ═══${NC}"
echo ""

# Create alert configuration
mkdir -p /opt/tradeai/config

cat > /opt/tradeai/config/alerts.json << 'EOF'
{
  "email": {
    "enabled": true,
    "recipients": ["alerts@tradeai.com", "admin@tradeai.com"],
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "tradeai@example.com",
        "pass": "your-password-here"
      }
    }
  },
  "slack": {
    "enabled": false,
    "webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  },
  "thresholds": {
    "cpu_percent": 80,
    "memory_percent": 85,
    "disk_percent": 80,
    "response_time_ms": 2000,
    "error_rate_percent": 5
  },
  "checks": {
    "backend_api": {
      "url": "http://localhost:5000/api/health",
      "interval_seconds": 60,
      "timeout_seconds": 5
    },
    "database": {
      "check": true,
      "interval_seconds": 300
    },
    "redis": {
      "check": true,
      "interval_seconds": 300
    }
  }
}
EOF

echo -e "${GREEN}✓ Alert configuration created${NC}"
echo -e "${YELLOW}⚠ Edit /opt/tradeai/config/alerts.json to configure email/Slack${NC}"

# 6. Dashboard Setup
echo ""
echo -e "${BLUE}═══ Setting up Monitoring Dashboard ═══${NC}"
echo ""

# Create simple monitoring dashboard
cat > /opt/tradeai/monitoring/dashboard.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TRADEAI Monitoring Dashboard</title>
    <meta http-equiv="refresh" content="30">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }
        .header {
            background: #1976d2;
            color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #1976d2;
        }
        .status-ok { color: #4caf50; }
        .status-warning { color: #ff9800; }
        .status-error { color: #f44336; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 TRADEAI Enterprise Monitoring</h1>
        <p>Real-time system health and performance metrics</p>
    </div>
    <div class="metrics" id="metrics">
        <div class="metric-card">
            <h3>Backend API</h3>
            <div class="metric-value status-ok" id="backend-status">●</div>
            <p>Status: <span id="backend-text">Checking...</span></p>
        </div>
        <div class="metric-card">
            <h3>Database</h3>
            <div class="metric-value status-ok" id="db-status">●</div>
            <p>Status: <span id="db-text">Checking...</span></p>
        </div>
        <div class="metric-card">
            <h3>Redis Cache</h3>
            <div class="metric-value status-ok" id="redis-status">●</div>
            <p>Status: <span id="redis-text">Checking...</span></p>
        </div>
        <div class="metric-card">
            <h3>Response Time</h3>
            <div class="metric-value" id="response-time">---</div>
            <p>Average (ms)</p>
        </div>
    </div>
    <script>
        async function checkHealth() {
            try {
                const response = await fetch('/api/super-admin/health');
                const data = await response.json();
                
                // Update UI based on health data
                if (data.success) {
                    document.getElementById('backend-status').className = 'metric-value status-ok';
                    document.getElementById('backend-text').textContent = 'Healthy';
                }
            } catch (error) {
                document.getElementById('backend-status').className = 'metric-value status-error';
                document.getElementById('backend-text').textContent = 'Down';
            }
        }
        
        setInterval(checkHealth, 30000);
        checkHealth();
    </script>
</body>
</html>
EOF

echo -e "${GREEN}✓ Monitoring dashboard created${NC}"
echo "  Access at: http://localhost:8080"

# 7. Performance Monitoring
echo ""
echo -e "${BLUE}═══ Setting up Performance Monitoring ═══${NC}"
echo ""

# Install PM2 monitoring tools
pm2 install pm2-logrotate || echo "PM2 logrotate already installed"
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

echo -e "${GREEN}✓ PM2 performance monitoring configured${NC}"

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║        Monitoring Setup Completed Successfully!        ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Monitoring Features Enabled:${NC}"
echo "  ✓ PM2 process monitoring"
echo "  ✓ Health checks (every 5 minutes)"
echo "  ✓ Automated backups (daily)"
echo "  ✓ Log rotation (14 days retention)"
echo "  ✓ Alert system"
echo "  ✓ Monitoring dashboard"
echo ""

echo -e "${BLUE}Monitoring Endpoints:${NC}"
echo "  • Dashboard:      http://localhost:8080"
echo "  • System Health:  http://localhost:5000/api/super-admin/health"
echo "  • PM2 Monitor:    pm2 monit"
echo ""

echo -e "${BLUE}Useful Commands:${NC}"
echo "  • View logs:      pm2 logs"
echo "  • Check status:   pm2 status"
echo "  • View metrics:   pm2 monit"
echo "  • View health:    tail -f /opt/tradeai/logs/health-check.log"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Configure email alerts in /opt/tradeai/config/alerts.json"
echo "  2. Set up Slack webhooks (optional)"
echo "  3. Test alert notifications"
echo "  4. Review monitoring dashboard"
echo "  5. Customize alert thresholds as needed"
echo ""

echo -e "${GREEN}✅ Monitoring setup complete!${NC}"
echo ""
