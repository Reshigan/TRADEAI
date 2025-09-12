# TRADEAI Production Deployment Guide

## 🚀 Quick Deployment

### Prerequisites
- Ubuntu 20.04+ or CentOS 7+ server
- Root access or sudo privileges
- Internet connection
- Domain name (optional, for SSL)

### One-Command Deployment

```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/Reshigan/TRADEAI/main/production-deploy.sh -o deploy.sh && chmod +x deploy.sh && sudo ./deploy.sh
```

### Manual Deployment Steps

1. **Clone Repository**:
   ```bash
   git clone https://github.com/Reshigan/TRADEAI.git
   cd TRADEAI
   ```

2. **Run Deployment Script**:
   ```bash
   chmod +x production-deploy.sh
   sudo ./production-deploy.sh
   ```

## 📊 What Gets Deployed

### Services
- **Frontend**: React application with TRADEAI branding
- **Backend**: Node.js API with authentication
- **Database**: PostgreSQL with production data
- **Cache**: Redis for session management
- **Reverse Proxy**: Nginx for load balancing

### Default Access
- **Frontend**: `http://your-server-ip:3000`
- **Backend API**: `http://your-server-ip:5000`
- **Admin Panel**: `http://your-server-ip:3000/admin`

### Default Credentials
- **Email**: `admin@gonxt.com`
- **Password**: `Admin123!`

## 🏢 Test Company & Accounts

The platform comes with **GONXT** company and 8 role-based test accounts:

1. **Super Admin**: `superadmin@gonxt.com` / `SuperAdmin123!`
2. **Admin**: `admin@gonxt.com` / `Admin123!`
3. **Manager**: `manager@gonxt.com` / `Manager123!`
4. **KAM**: `kam@gonxt.com` / `KAM123!`
5. **Sales Rep**: `salesrep@gonxt.com` / `SalesRep123!`
6. **Marketing**: `marketing@gonxt.com` / `Marketing123!`
7. **Finance**: `finance@gonxt.com` / `Finance123!`
8. **Viewer**: `viewer@gonxt.com` / `Viewer123!`

## 🛠️ Management Commands

### View Logs
```bash
cd /opt/tradeai
docker-compose -f docker-compose.production.yml logs -f
```

### Restart Services
```bash
cd /opt/tradeai
docker-compose -f docker-compose.production.yml restart
```

### Stop Services
```bash
cd /opt/tradeai
docker-compose -f docker-compose.production.yml down
```

### Update Platform
```bash
cd /opt/tradeai
git pull
docker-compose -f docker-compose.production.yml up -d --build
```

### Backup Data
```bash
cd /opt/tradeai
./production/backup.sh
```

## 🔒 Security Setup

### 1. Change Default Passwords
- Login to admin panel
- Change all default passwords
- Update user accounts

### 2. Configure Firewall
```bash
# Install UFW
apt-get install -y ufw

# Allow SSH
ufw allow 22

# Allow HTTP/HTTPS
ufw allow 80
ufw allow 443

# Allow application ports
ufw allow 3000
ufw allow 5000

# Enable firewall
ufw --force enable
```

### 3. Setup SSL Certificate
```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
certbot --nginx -d yourdomain.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Configure Nginx (Optional)
```bash
# Edit nginx configuration
nano /etc/nginx/sites-available/tradeai

# Add SSL and domain configuration
# Restart nginx
systemctl restart nginx
```

## 📈 Monitoring & Maintenance

### Health Checks
```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# Check logs
docker-compose -f docker-compose.production.yml logs -f [service_name]

# Check system resources
htop
df -h
```

### Regular Maintenance
1. **Daily**: Check logs for errors
2. **Weekly**: Run backups
3. **Monthly**: Update system packages
4. **Quarterly**: Review security settings

## 🆘 Troubleshooting

### Common Issues

1. **Services won't start**:
   ```bash
   docker-compose -f docker-compose.production.yml down
   docker system prune -f
   docker-compose -f docker-compose.production.yml up -d --build
   ```

2. **Database connection issues**:
   ```bash
   docker-compose -f docker-compose.production.yml restart postgres
   ```

3. **Frontend not loading**:
   ```bash
   docker-compose -f docker-compose.production.yml restart frontend
   ```

4. **API errors**:
   ```bash
   docker-compose -f docker-compose.production.yml logs backend
   ```

### Support
- Check logs first: `docker-compose logs -f`
- Review deployment-info.txt for credentials
- Ensure all ports are open in firewall
- Verify domain DNS settings (if using domain)

## 📁 Directory Structure

```
/opt/tradeai/
├── production/          # Production configurations
├── data/               # Persistent data
│   ├── postgres/       # Database files
│   ├── redis/          # Cache files
│   ├── uploads/        # User uploads
│   └── backups/        # Backup files
├── logs/               # Application logs
├── frontend/           # React application
├── backend/            # Node.js API
└── deployment-info.txt # Deployment credentials
```

## 🎯 Next Steps

1. **Access the platform**: Visit `http://your-server-ip:3000`
2. **Login as admin**: Use `admin@gonxt.com` / `Admin123!`
3. **Change passwords**: Update all default credentials
4. **Configure company**: Set up your company details
5. **Add users**: Create real user accounts
6. **Setup SSL**: Configure HTTPS for security
7. **Configure backups**: Set up automated backups

## 🌟 Features Available

- ✅ **Multi-tenant Architecture** with company isolation
- ✅ **Role-based Access Control** (8 permission levels)
- ✅ **AI-powered Analytics** and reporting
- ✅ **Budget Management** with approval workflows
- ✅ **Campaign Tracking** and performance metrics
- ✅ **Real-time Notifications** and alerts
- ✅ **Document Management** with file uploads
- ✅ **API Integration** for third-party tools
- ✅ **Mobile Responsive** design
- ✅ **Production Ready** with security hardening

Your TRADEAI platform is now ready for production use! 🚀