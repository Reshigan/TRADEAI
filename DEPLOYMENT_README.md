# 🚀 TRADEAI Deployment Guide

## Quick Start (Recommended)

For a complete automated deployment with server cleanup:

```bash
git clone https://github.com/Reshigan/TRADEAI.git
cd TRADEAI
chmod +x quick-deploy.sh
./quick-deploy.sh
```

This script will:
- ✅ Clean up any existing installations
- ✅ Install all dependencies (Docker, Node.js, etc.)
- ✅ Configure environment with secure defaults
- ✅ Deploy all services with Docker Compose
- ✅ Initialize the database with production data
- ✅ Verify the installation

## Manual Installation

For detailed step-by-step instructions, see: **[CLEAN_INSTALL_KIT.md](CLEAN_INSTALL_KIT.md)**

## Access Your Application

After deployment, access TRADEAI at:

- **Frontend**: `http://your-server-ip:3001`
- **Backend API**: `http://your-server-ip:5001`
- **AI Services**: `http://your-server-ip:8000`
- **Monitoring**: `http://your-server-ip:8081`

## Default Login Credentials

**GONXT Admin:**
- Email: `admin@gonxt.tech`
- Password: `GonxtAdmin2024!`

**Test Company Admin:**
- Email: `admin@test.demo`
- Password: `TestAdmin2024!`

## Health Check

Run the health check script to verify all services:

```bash
./health-check.sh
```

## Troubleshooting

If you encounter issues:

1. Check service logs: `docker-compose logs -f`
2. Restart services: `docker-compose restart`
3. See detailed troubleshooting in [CLEAN_INSTALL_KIT.md](CLEAN_INSTALL_KIT.md)

## Support

- 📖 Full documentation: [CLEAN_INSTALL_KIT.md](CLEAN_INSTALL_KIT.md)
- 🐛 Issues: Create a GitHub issue
- 💬 Questions: Check the troubleshooting section

---

**Ready to deploy? Run `./quick-deploy.sh` and you'll be up and running in minutes!**