# 📥 How to Get Scripts onto Your Server

Here are multiple ways to transfer the access setup scripts to your server:

## 🚀 Method 1: Direct Download (Easiest)

Since your TRADEAI repository is on GitHub, you can download directly:

```bash
# SSH into your server first
ssh your-username@your-server-ip

# Then download the script directly
wget https://raw.githubusercontent.com/Reshigan/TRADEAI/main/setup-web-access.sh
chmod +x setup-web-access.sh
sudo ./setup-web-access.sh
```

## 🔄 Method 2: Git Clone (Recommended)

Clone the entire repository to get all scripts:

```bash
# On your server
git clone https://github.com/Reshigan/TRADEAI.git
cd TRADEAI

# Choose and run your preferred script
sudo chmod +x setup-web-access.sh
sudo ./setup-web-access.sh
```

## 📋 Method 3: Copy-Paste (Quick)

1. **Copy the script content** from below
2. **SSH into your server**
3. **Create the file** and paste the content
4. **Run the script**

```bash
# On your server
nano setup-web-access.sh
# Paste the script content (provided below)
# Save with Ctrl+X, Y, Enter

chmod +x setup-web-access.sh
sudo ./setup-web-access.sh
```

## 📤 Method 4: SCP/SFTP Upload

If you have the files locally:

```bash
# From your local machine
scp setup-web-access.sh your-username@your-server-ip:/tmp/
ssh your-username@your-server-ip
cd /tmp
chmod +x setup-web-access.sh
sudo ./setup-web-access.sh
```

## 🌐 Method 5: One-Line Command (Super Easy)

Run this single command on your server:

```bash
curl -fsSL https://raw.githubusercontent.com/Reshigan/TRADEAI/main/setup-web-access.sh | sudo bash
```

---

# 📜 Complete Script Content (for Copy-Paste)

If you want to copy-paste, here's the complete web access script:

```bash
#!/bin/bash

# TRADEAI Web-Based Access Setup Script
# Creates a secure web terminal for remote assistance
# Easiest option - no SSH configuration needed

set -e

echo "🌐 TRADEAI Web Access Setup"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_header "1. Installing Dependencies"

# Update system
apt-get update -y

# Install required packages
apt-get install -y curl wget git nodejs npm python3 python3-pip psutil

# Install ttyd (web terminal)
if ! command -v ttyd &> /dev/null; then
    print_status "Installing ttyd (web terminal)..."
    wget -O /usr/local/bin/ttyd https://github.com/tsl0922/ttyd/releases/latest/download/ttyd.x86_64
    chmod +x /usr/local/bin/ttyd
fi

print_header "2. Creating Web Access User"

# Create web access user
WEB_USER="tradeai_web"
WEB_PASSWORD=$(openssl rand -base64 16)

if id "$WEB_USER" &>/dev/null; then
    print_warning "User $WEB_USER already exists. Removing..."
    userdel -r $WEB_USER 2>/dev/null || true
fi

useradd -m -s /bin/bash $WEB_USER
echo "$WEB_USER:$WEB_PASSWORD" | chpasswd
usermod -aG sudo $WEB_USER
usermod -aG docker $WEB_USER 2>/dev/null || true

print_header "3. Setting up Web Terminal"

# Create web terminal configuration
WEB_PORT=9999
WEB_DIR="/opt/tradeai-web"
mkdir -p $WEB_DIR

# Create startup script for web terminal
cat > $WEB_DIR/start-web-terminal.sh << EOF
#!/bin/bash

# Start web terminal with authentication
ttyd -p $WEB_PORT \\
     -c $WEB_USER:$WEB_PASSWORD \\
     -t titleFixed="TRADEAI Remote Terminal" \\
     -t fontSize=14 \\
     -t theme='{"background": "#1e1e1e", "foreground": "#d4d4d4"}' \\
     -W /opt/tradeai \\
     bash
EOF

chmod +x $WEB_DIR/start-web-terminal.sh

print_header "4. Creating System Information API"

# Install psutil for Python
pip3 install psutil

# Create simple web API for system information
cat > $WEB_DIR/system-info.py << 'EOF'
#!/usr/bin/env python3

import json
import subprocess
import socket
import psutil
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

class SystemInfoHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/info':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            info = self.get_system_info()
            self.wfile.write(json.dumps(info, indent=2).encode())
        
        elif self.path == '/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            status = self.get_service_status()
            self.wfile.write(json.dumps(status, indent=2).encode())
        
        else:
            self.send_response(404)
            self.end_headers()
    
    def get_system_info(self):
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            
            # Get public IP
            try:
                import urllib.request
                public_ip = urllib.request.urlopen('https://ifconfig.me').read().decode().strip()
            except:
                public_ip = "Unable to detect"
            
            # Get system stats
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                "timestamp": datetime.now().isoformat(),
                "hostname": hostname,
                "local_ip": local_ip,
                "public_ip": public_ip,
                "system": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_total_gb": round(memory.total / (1024**3), 2),
                    "disk_percent": round((disk.used / disk.total) * 100, 2),
                    "disk_total_gb": round(disk.total / (1024**3), 2)
                }
            }
        except Exception as e:
            return {"error": str(e)}
    
    def get_service_status(self):
        services = {}
        ports = [22, 80, 443, 3000, 5000, 8000, 8080, 27017, 6379]
        
        for port in ports:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', port))
                services[f"port_{port}"] = "open" if result == 0 else "closed"
                sock.close()
            except:
                services[f"port_{port}"] = "error"
        
        # Check Docker
        try:
            result = subprocess.run(['docker', 'ps'], capture_output=True, text=True)
            services["docker"] = "running" if result.returncode == 0 else "error"
            services["docker_containers"] = len(result.stdout.strip().split('\n')) - 1 if result.returncode == 0 else 0
        except:
            services["docker"] = "not_installed"
        
        return services

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8888), SystemInfoHandler)
    print("System Info API running on port 8888")
    server.serve_forever()
EOF

chmod +x $WEB_DIR/system-info.py

print_header "5. Setting up Services"

# Create systemd service for web terminal
cat > /etc/systemd/system/tradeai-web-terminal.service << EOF
[Unit]
Description=TRADEAI Web Terminal
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$WEB_DIR
ExecStart=$WEB_DIR/start-web-terminal.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for system info API
cat > /etc/systemd/system/tradeai-system-info.service << EOF
[Unit]
Description=TRADEAI System Info API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$WEB_DIR
ExecStart=/usr/bin/python3 $WEB_DIR/system-info.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
systemctl daemon-reload
systemctl enable tradeai-web-terminal.service
systemctl enable tradeai-system-info.service

systemctl start tradeai-web-terminal.service
systemctl start tradeai-system-info.service

print_header "6. Configuring Firewall"

# Open required ports
if command -v ufw &> /dev/null; then
    ufw allow 8888  # System Info API
    ufw allow 9999  # Web Terminal
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=8888/tcp
    firewall-cmd --permanent --add-port=9999/tcp
    firewall-cmd --reload
fi

print_header "7. Setting up Auto-cleanup"

# Create cleanup script
cat > /usr/local/bin/cleanup-tradeai-web.sh << 'EOF'
#!/bin/bash
echo "Cleaning up TRADEAI web access..."
systemctl stop tradeai-web-terminal.service
systemctl stop tradeai-system-info.service
systemctl disable tradeai-web-terminal.service
systemctl disable tradeai-system-info.service
rm -f /etc/systemd/system/tradeai-*.service
systemctl daemon-reload
userdel -r tradeai_web 2>/dev/null || true
rm -rf /opt/tradeai-web
rm -f /etc/cron.d/tradeai-web-cleanup
rm -f /usr/local/bin/cleanup-tradeai-web.sh
echo "Cleanup completed"
EOF

chmod +x /usr/local/bin/cleanup-tradeai-web.sh

# Set up auto-cleanup (24 hours)
cat > /etc/cron.d/tradeai-web-cleanup << EOF
# Remove TRADEAI web access after 24 hours
0 */24 * * * root /usr/local/bin/cleanup-tradeai-web.sh
EOF

print_header "8. Final Setup"

# Get system information
HOSTNAME=$(hostname)
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "Unable to detect")

# Create connection info file
cat > /tmp/tradeai_web_access.txt << EOF
TRADEAI Web Access Information
=============================

Server: $HOSTNAME ($PUBLIC_IP)

Web Terminal: http://$PUBLIC_IP:9999
System API: http://$PUBLIC_IP:8888

Web Terminal Credentials:
Username: $WEB_USER
Password: $WEB_PASSWORD

Services:
- Terminal: Port 9999  
- System API: Port 8888

Auto-cleanup: 24 hours
Manual cleanup: sudo /usr/local/bin/cleanup-tradeai-web.sh

Generated: $(date)
EOF

echo ""
echo "================================================"
echo "🌐 WEB ACCESS SETUP COMPLETED"
echo "================================================"
echo ""
cat /tmp/tradeai_web_access.txt
echo ""
echo "================================================"
echo "📋 NEXT STEPS"
echo "================================================"
echo "1. Open the web terminal in your browser:"
echo "   http://$PUBLIC_IP:9999"
echo ""
echo "2. Use these credentials to login:"
echo "   Username: $WEB_USER"
echo "   Password: $WEB_PASSWORD"
echo ""
echo "3. Share this connection information with the AI assistant"
echo ""
echo "4. The assistant will use the web terminal for bug fixing and deployment"
echo ""
print_warning "Keep credentials secure and delete after use"
echo ""
```

---

## 🎯 Recommended Steps:

1. **SSH into your server**
2. **Run the one-line command** (easiest):
   ```bash
   curl -fsSL https://raw.githubusercontent.com/Reshigan/TRADEAI/main/setup-web-access.sh | sudo bash
   ```
3. **Share the connection information** it displays with me
4. **I'll connect and start fixing everything!**

Which method would you prefer to use?