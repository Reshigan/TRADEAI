# TRADEAI Production - Quick Reference Guide

## 🔗 Access URLs

**Application:** https://tradeai.gonxt.tech  
**API Health:** https://tradeai.gonxt.tech/api/health  
**Server IP:** 3.10.212.143

---

## 🔐 SSH Access

```bash
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143
```

---

## ✅ Quick Status Check

```bash
# One-liner status check
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "curl -s http://localhost:5002/api/health | jq"

# Check all services
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "ps aux | grep -E 'nginx|mongod|redis|node' | grep -v grep"

# View backend logs (last 50 lines)
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "tail -50 /home/ubuntu/backend.log"

# Follow backend logs in real-time
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "tail -f /home/ubuntu/backend.log"
```

---

## 🔄 Service Management

### Restart Backend

```bash
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 << 'EOF'
pkill -f "node.*server.js"
cd /home/ubuntu/tradeai/backend
NODE_ENV=production nohup node src/server.js > /home/ubuntu/backend.log 2>&1 &
echo "Backend restarted. Check logs: tail -f /home/ubuntu/backend.log"
EOF
```

### Restart Nginx

```bash
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "sudo systemctl restart nginx && sudo systemctl status nginx"
```

### Restart MongoDB

```bash
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "sudo systemctl restart mongod && sudo systemctl status mongod"
```

### Restart Redis

```bash
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "sudo systemctl restart redis && sudo systemctl status redis"
```

---

## 📊 Monitoring Commands

### System Resources

```bash
# CPU and Memory
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "free -h && echo '' && top -bn1 | head -15"

# Disk Usage
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "df -h /"

# Process List
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "ps aux --sort=-%mem | head -10"
```

### Application Health

```bash
# API Health
curl -s https://tradeai.gonxt.tech/api/health | jq

# Frontend Status
curl -I https://tradeai.gonxt.tech/

# Response Time Test
curl -w "Response Time: %{time_total}s\n" -o /dev/null -s https://tradeai.gonxt.tech/
```

---

## 📝 Log Files

| Service | Log Location |
|---------|--------------|
| Backend | `/home/ubuntu/backend.log` |
| Nginx Access | `/var/log/nginx/access.log` |
| Nginx Error | `/var/log/nginx/error.log` |
| MongoDB | `/var/log/mongodb/mongod.log` |
| Redis | `/var/log/redis/redis-server.log` |

### View Logs

```bash
# Backend (last 50 lines)
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "tail -50 /home/ubuntu/backend.log"

# Nginx errors (last 50 lines)
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "sudo tail -50 /var/log/nginx/error.log"

# Real-time log monitoring
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "tail -f /home/ubuntu/backend.log"
```

---

## 🔧 Troubleshooting

### Backend Not Responding

```bash
# Check if backend is running
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "ps aux | grep 'node.*server' | grep -v grep"

# Check logs for errors
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "tail -100 /home/ubuntu/backend.log | grep -i error"

# Restart backend
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "pkill -f 'node.*server.js' && cd /home/ubuntu/tradeai/backend && NODE_ENV=production nohup node src/server.js > /home/ubuntu/backend.log 2>&1 &"
```

### Frontend Not Loading

```bash
# Check Nginx status
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "sudo systemctl status nginx"

# Test Nginx configuration
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "sudo nginx -t"

# Reload Nginx
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "sudo systemctl reload nginx"

# Check frontend files
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "ls -la /var/www/tradeai/"
```

### Database Connection Issues

```bash
# Check MongoDB status
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "sudo systemctl status mongod"

# Check Redis status
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "sudo systemctl status redis"

# Test MongoDB connection
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "mongosh --eval 'db.adminCommand({ ping: 1 })'"

# Test Redis connection
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "redis-cli ping"
```

---

## 🔒 SSL Certificate

### Check Certificate Status

```bash
# View certificate details
echo | openssl s_client -servername tradeai.gonxt.tech -connect tradeai.gonxt.tech:443 2>/dev/null | openssl x509 -noout -dates

# Current certificate expires: Jan 5, 2026
```

### Renew Certificate

```bash
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "sudo certbot renew && sudo systemctl reload nginx"
```

---

## 💾 Backup & Restore

### Create Backup

```bash
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 << 'EOF'
BACKUP_DIR="/home/ubuntu/tradeai-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cd /home/ubuntu
tar -czf $BACKUP_DIR/tradeai-backup-$TIMESTAMP.tar.gz tradeai/
echo "Backup created: $BACKUP_DIR/tradeai-backup-$TIMESTAMP.tar.gz"
ls -lh $BACKUP_DIR/
EOF
```

### Restore from Backup

```bash
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 << 'EOF'
# List available backups
ls -lh /home/ubuntu/tradeai-backups/

# To restore, uncomment and modify the following:
# BACKUP_FILE="tradeai-backup-20251007_185957.tar.gz"
# pkill -f "node.*server.js"
# cd /home/ubuntu
# rm -rf tradeai
# tar -xzf tradeai-backups/$BACKUP_FILE
# cd tradeai/backend
# NODE_ENV=production nohup node src/server.js > /home/ubuntu/backend.log 2>&1 &
EOF
```

---

## 🚀 Deployment

### Deploy New Code

```bash
# 1. Create backup first
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "cd /home/ubuntu && tar -czf tradeai-backups/pre-deploy-$(date +%Y%m%d_%H%M%S).tar.gz tradeai/"

# 2. Upload new code (from local machine where code is)
# scp -i "VantaX-2.pem" -r ./TRADEAI/* ubuntu@3.10.212.143:/home/ubuntu/tradeai/

# 3. Install dependencies and rebuild
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 << 'EOF'
cd /home/ubuntu/tradeai/backend
npm install --production
cd /home/ubuntu/tradeai/frontend
npm install
npm run build
sudo rm -rf /var/www/tradeai/*
sudo cp -r build/* /var/www/tradeai/
sudo chown -R www-data:www-data /var/www/tradeai
EOF

# 4. Restart backend
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "pkill -f 'node.*server.js' && cd /home/ubuntu/tradeai/backend && NODE_ENV=production nohup node src/server.js > /home/ubuntu/backend.log 2>&1 &"
```

---

## 🧪 Testing Commands

### Run Production Tests

```bash
# Comprehensive test
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "bash /home/ubuntu/comprehensive-production-test.sh"

# Detailed feature test
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "bash /home/ubuntu/detailed-feature-test.sh"
```

---

## 📞 Quick Alerts

### Set Up Simple Monitoring

```bash
# Create a simple health check script
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "cat > /home/ubuntu/health-check.sh << 'SCRIPT'
#!/bin/bash
STATUS=\$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5002/api/health)
if [ \"\$STATUS\" != \"200\" ]; then
    echo \"API is down! Status: \$STATUS\" | logger -t tradeai-monitor
    # Add email/SMS notification here
fi
SCRIPT
chmod +x /home/ubuntu/health-check.sh"

# Add to crontab (run every 5 minutes)
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143 "(crontab -l 2>/dev/null; echo '*/5 * * * * /home/ubuntu/health-check.sh') | crontab -"
```

---

## 📋 Environment Variables

Located in:
- Backend: `/home/ubuntu/tradeai/backend/.env.production`
- Root: `/home/ubuntu/tradeai/.env.production`

**Never commit these files to version control!**

---

## 🆘 Emergency Contacts

| Issue Type | Action |
|------------|--------|
| Server Down | Check AWS Console, restart services |
| Database Issues | Check MongoDB/Redis logs, restart if needed |
| SSL Expired | Run certbot renew |
| High CPU/Memory | Check processes, restart backend if needed |
| Frontend 404 | Check Nginx config and /var/www/tradeai/ |

---

## 📊 Key Metrics to Monitor

- Backend uptime (should be > 99%)
- API response time (should be < 1s)
- Memory usage (should be < 80%)
- Disk usage (should be < 80%)
- SSL certificate validity (renew before expiry)
- Error rate in logs (should be minimal)

---

**Last Updated:** October 7, 2025  
**System Version:** 1.0.0  
**Production Status:** ✅ OPERATIONAL
