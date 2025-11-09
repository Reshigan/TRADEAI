
# TradeAI Alerting Configuration

## Email Alerts
Configure email alerts for:
- PM2 process crashes
- High CPU usage (>80%)
- High memory usage (>90%)
- Disk space low (<10%)
- Backend errors (>10 per minute)

## Recommended Tool: PM2 Plus (https://pm2.io)
pm2 link <secret> <public>

## Alternative: Simple Email Alerting
Create /home/ubuntu/alert.sh:

#!/bin/bash
ALERT_EMAIL="admin@example.com"
SUBJECT="TradeAI Alert: $1"
MESSAGE="$2"

echo "$MESSAGE" | mail -s "$SUBJECT" "$ALERT_EMAIL"

## Usage Examples:
# CPU alert
if [ $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1) -gt 80 ]; then
    ./alert.sh "High CPU" "CPU usage above 80%"
fi

# Memory alert  
if [ $(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d'.' -f1) -gt 90 ]; then
    ./alert.sh "High Memory" "Memory usage above 90%"
fi

# Disk alert
if [ $(df -h / | tail -1 | awk '{print $5}' | cut -d'%' -f1) -gt 90 ]; then
    ./alert.sh "Low Disk Space" "Disk usage above 90%"
fi
