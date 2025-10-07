# 🚀 TRADEAI Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the TRADEAI system to production server at `3.10.212.143` with domain `tradeai.gonxt.tech` and SSL encryption.

## 📋 Prerequisites

- **Server Access**: SSH access with PEM key (`Vantax-2.pem`)
- **Server Specs**: Ubuntu 20.04+ with minimum 2GB RAM, 20GB disk
- **Domain**: DNS pointing `tradeai.gonxt.tech` to `3.10.212.143`
- **GitHub Access**: Token for private repository access
- **Local Tools**: SSH client, Git

## 🔐 Authentication

### SSH Access
```bash
chmod 600 /path/to/Vantax-2.pem
ssh -i /path/to/Vantax-2.pem ubuntu@3.10.212.143
```

### GitHub Token
```
Token: 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
Repo: https://github.com/Reshigan/TRADEAI.git
```

## 🚀 Deployment Steps

### Method 1: Automated Deployment Script (Recommended)

```bash
# 1. Make script executable
chmod +x deploy-production.sh

# 2. Run deployment
./deploy-production.sh
```

The script will automatically:
- ✅ Verify SSH connection
- ✅ Install system dependencies (Nginx, Node.js, MongoDB)
- ✅ Clone/update repository
- ✅ Configure MongoDB
- ✅ Setup production environment variables
- ✅ Deploy backend API as systemd service
- ✅ Build and deploy frontend
- ✅ Configure Nginx reverse proxy
- ✅ Setup SSL with Let's Encrypt
- ✅ Configure firewall
- ✅ Verify deployment

### Method 2: Manual Deployment

<details>
<summary>Click to expand manual steps</summary>

#### Step 1: Connect to Server
```bash
ssh -i Vantax-2.pem ubuntu@3.10.212.143
```

#### Step 2: Update System
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y nginx git curl python3 python3-pip nodejs npm mongodb certbot python3-certbot-nginx
```

#### Step 3: Clone Repository
```bash
git clone https://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@github.com/Reshigan/TRADEAI.git /home/ubuntu/tradeai
cd /home/ubuntu/tradeai
```

#### Step 4: Setup Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python init_db.py
```

#### Step 5: Create Backend Service
```bash
sudo nano /etc/systemd/system/tradeai-backend.service
```

Paste the following:
```ini
[Unit]
Description=TRADEAI Backend API
After=network.target mongodb.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/tradeai/backend
Environment="PATH=/home/ubuntu/tradeai/backend/venv/bin"
ExecStart=/home/ubuntu/tradeai/backend/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable tradeai-backend
sudo systemctl start tradeai-backend
```

#### Step 6: Build Frontend
```bash
cd /home/ubuntu/tradeai/frontend
npm install
echo "REACT_APP_API_URL=https://tradeai.gonxt.tech/api" > .env.production
echo "REACT_APP_ENV=production" >> .env.production
npm run build
```

#### Step 7: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/tradeai
```

Paste the configuration:
```nginx
server {
    listen 80;
    server_name tradeai.gonxt.tech;
    
    root /home/ubuntu/tradeai/frontend/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:5002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/tradeai /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 8: Setup SSL
```bash
sudo certbot --nginx -d tradeai.gonxt.tech --non-interactive --agree-tos --email admin@tradeai.gonxt.tech --redirect
```

#### Step 9: Configure Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

</details>

## ✅ Post-Deployment Verification

### 1. Check Services
```bash
ssh -i Vantax-2.pem ubuntu@3.10.212.143 "
  echo 'Backend:' && sudo systemctl status tradeai-backend --no-pager
  echo 'Nginx:' && sudo systemctl status nginx --no-pager
  echo 'MongoDB:' && sudo systemctl status mongodb --no-pager
"
```

### 2. Test Application
```bash
# Test frontend
curl -I https://tradeai.gonxt.tech

# Test backend API
curl https://tradeai.gonxt.tech/api/health
```

### 3. Run E2E Tests
```bash
# From local machine
npm run test:e2e:production
```

## 🧪 End-to-End Testing

### Run Production Tests
```bash
# Run all production E2E tests
PROD_URL=https://tradeai.gonxt.tech npx playwright test tests/e2e/production-test.spec.js

# Run with UI
npm run test:e2e:production:headed

# View test report
npm run test:e2e:production:report
```

### Test Coverage
The production test suite includes:
- ✅ SSL certificate validation
- ✅ Application load without errors
- ✅ API endpoint accessibility
- ✅ Static asset loading
- ✅ Authentication system
- ✅ Core functionality (all modules)
- ✅ Performance benchmarks
- ✅ Security checks
- ✅ Data integrity
- ✅ Monitoring and logging

## 🔍 Monitoring & Logs

### View Logs
```bash
# Backend logs
ssh -i Vantax-2.pem ubuntu@3.10.212.143 "sudo journalctl -u tradeai-backend -f"

# Nginx access logs
ssh -i Vantax-2.pem ubuntu@3.10.212.143 "sudo tail -f /var/log/nginx/access.log"

# Nginx error logs
ssh -i Vantax-2.pem ubuntu@3.10.212.143 "sudo tail -f /var/log/nginx/error.log"

# MongoDB logs
ssh -i Vantax-2.pem ubuntu@3.10.212.143 "sudo journalctl -u mongodb -f"
```

### Service Management
```bash
# Restart backend
ssh -i Vantax-2.pem ubuntu@3.10.212.143 "sudo systemctl restart tradeai-backend"

# Restart Nginx
ssh -i Vantax-2.pem ubuntu@3.10.212.143 "sudo systemctl restart nginx"

# Check status
ssh -i Vantax-2.pem ubuntu@3.10.212.143 "sudo systemctl status tradeai-backend"
```

## 🔄 Updates & Maintenance

### Deploying Updates
```bash
ssh -i Vantax-2.pem ubuntu@3.10.212.143 "
  cd /home/ubuntu/tradeai
  git pull origin main
  
  # Update backend
  cd backend
  source venv/bin/activate
  pip install -r requirements.txt
  sudo systemctl restart tradeai-backend
  
  # Update frontend
  cd ../frontend
  npm install
  npm run build
  sudo systemctl reload nginx
"
```

### Database Backup
```bash
ssh -i Vantax-2.pem ubuntu@3.10.212.143 "
  mongodump --db tradeai_production --out /home/ubuntu/backups/$(date +%Y%m%d)
"
```

### SSL Certificate Renewal
```bash
ssh -i Vantax-2.pem ubuntu@3.10.212.143 "
  sudo certbot renew
  sudo systemctl reload nginx
"
```

## 🌐 Application Access

### URLs
- **Frontend**: https://tradeai.gonxt.tech
- **Backend API**: https://tradeai.gonxt.tech/api
- **Health Check**: https://tradeai.gonxt.tech/api/health

### Default Credentials
```
Email: admin@tradeai.com
Password: admin123
```

⚠️ **IMPORTANT**: Change default password immediately after first login!

## 📊 Performance Optimization

### Nginx Caching
Add to Nginx configuration:
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### MongoDB Indexing
```bash
mongo tradeai_production --eval "
  db.budgets.createIndex({company_id: 1, year: 1});
  db.trade_spends.createIndex({budget_id: 1});
  db.promotions.createIndex({start_date: 1, end_date: 1});
"
```

### PM2 Process Manager (Optional)
```bash
npm install -g pm2
cd /home/ubuntu/tradeai/backend
pm2 start app.py --name tradeai-backend --interpreter python3
pm2 save
pm2 startup
```

## 🔒 Security Best Practices

### 1. Firewall Configuration
```bash
sudo ufw status
sudo ufw allow from YOUR_IP to any port 22  # Restrict SSH to specific IPs
```

### 2. MongoDB Authentication
```javascript
// In MongoDB shell
use admin
db.createUser({
  user: "tradeai_admin",
  pwd: "STRONG_PASSWORD",
  roles: ["dbOwner"]
})
```

### 3. Environment Variables
Store sensitive data in `.env.production`:
```bash
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=strong_password_here
API_KEY=your_api_key_here
```

### 4. Regular Updates
```bash
sudo apt-get update && sudo apt-get upgrade -y
```

## 🆘 Troubleshooting

### Issue: Backend Not Starting
```bash
# Check logs
sudo journalctl -u tradeai-backend -n 50

# Check port availability
sudo lsof -i :5002

# Restart service
sudo systemctl restart tradeai-backend
```

### Issue: Nginx 502 Bad Gateway
```bash
# Check backend is running
curl http://localhost:5002

# Check Nginx configuration
sudo nginx -t

# Restart both services
sudo systemctl restart tradeai-backend nginx
```

### Issue: SSL Certificate Issues
```bash
# Test certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal
```

### Issue: Database Connection Failed
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Restart MongoDB
sudo systemctl restart mongodb

# Check logs
sudo journalctl -u mongodb -n 50
```

## 📞 Support

For issues or questions:
- **GitHub Issues**: https://github.com/Reshigan/TRADEAI/issues
- **Email**: support@tradeai.com
- **Documentation**: https://github.com/Reshigan/TRADEAI/docs

## 📝 Deployment Checklist

- [ ] DNS configured (tradeai.gonxt.tech → 3.10.212.143)
- [ ] SSH access verified
- [ ] GitHub access configured
- [ ] System dependencies installed
- [ ] Repository cloned
- [ ] MongoDB configured
- [ ] Backend service running
- [ ] Frontend built and deployed
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Services verified
- [ ] E2E tests passed
- [ ] Default password changed
- [ ] Backup system configured
- [ ] Monitoring setup
- [ ] Documentation reviewed

## 🎉 Success Indicators

After successful deployment, you should see:
- ✅ HTTPS works (green padlock in browser)
- ✅ All services running (backend, nginx, mongodb)
- ✅ Can login at https://tradeai.gonxt.tech
- ✅ All modules accessible
- ✅ E2E tests passing
- ✅ No errors in logs

---

**Version**: 1.0  
**Last Updated**: 2025-10-07  
**Maintained By**: TRADEAI DevOps Team
