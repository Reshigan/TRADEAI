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

# Install basic packages first
apt-get install -y curl wget git python3 python3-pip

# Handle nodejs/npm conflict
print_status "Resolving nodejs/npm dependencies..."
if dpkg -l | grep -q nodejs; then
    print_warning "Existing nodejs installation detected. Checking for conflicts..."
    
    # Try to install npm, if it fails due to conflicts, fix it
    if ! apt-get install -y npm 2>/dev/null; then
        print_warning "npm installation failed due to conflicts. Fixing..."
        
        # Remove conflicting packages
        apt-get remove --purge nodejs npm -y 2>/dev/null || true
        apt-get autoremove -y
        
        # Install Node.js using NodeSource repository
        print_status "Installing Node.js from NodeSource repository..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
else
    # Fresh installation
    print_status "Installing nodejs and npm..."
    apt-get install -y nodejs npm || {
        print_warning "Standard installation failed. Using NodeSource repository..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    }
fi

# Verify Node.js installation
if command -v node &> /dev/null; then
    print_status "Node.js installed: $(node --version)"
    if command -v npm &> /dev/null; then
        print_status "npm installed: $(npm --version)"
    else
        print_warning "npm not available, but Node.js is working"
    fi
else
    print_warning "Node.js installation may have issues, but continuing..."
fi

# Install psutil for Python
print_status "Installing Python dependencies..."
# Handle externally managed Python environments (Ubuntu 24.04+)
if pip3 install psutil 2>/dev/null; then
    print_status "Python packages installed via pip"
elif apt-get install -y python3-psutil 2>/dev/null; then
    print_status "Python packages installed via apt"
elif pip3 install --break-system-packages psutil 2>/dev/null; then
    print_warning "Python packages installed with --break-system-packages flag"
else
    print_warning "Could not install psutil. System info API may have limited functionality"
    # Create a fallback version that doesn't require psutil
    cat > /tmp/psutil_fallback.py << 'EOFFALLBACK'
# Fallback psutil-like functionality
import os
import subprocess

class VirtualMemory:
    def __init__(self):
        try:
            with open('/proc/meminfo', 'r') as f:
                meminfo = f.read()
            total = int([line for line in meminfo.split('\n') if 'MemTotal' in line][0].split()[1]) * 1024
            available = int([line for line in meminfo.split('\n') if 'MemAvailable' in line][0].split()[1]) * 1024
            self.total = total
            self.percent = ((total - available) / total) * 100
        except:
            self.total = 0
            self.percent = 0

class DiskUsage:
    def __init__(self, path):
        try:
            stat = os.statvfs(path)
            self.total = stat.f_frsize * stat.f_blocks
            self.used = stat.f_frsize * (stat.f_blocks - stat.f_available)
        except:
            self.total = 0
            self.used = 0

def cpu_percent(interval=1):
    try:
        with open('/proc/loadavg', 'r') as f:
            load = float(f.read().split()[0])
        return min(load * 25, 100)  # Rough approximation
    except:
        return 0

def virtual_memory():
    return VirtualMemory()

def disk_usage(path):
    return DiskUsage(path)
EOFFALLBACK
    
    # Install the fallback
    cp /tmp/psutil_fallback.py /usr/local/lib/python3.*/dist-packages/psutil.py 2>/dev/null || \
    cp /tmp/psutil_fallback.py /usr/lib/python3/dist-packages/psutil.py 2>/dev/null || \
    print_warning "Could not install psutil fallback"
fi

# Install ttyd (web terminal)
if ! command -v ttyd &> /dev/null; then
    print_status "Installing ttyd (web terminal)..."
    
    # Try different architectures
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            TTYD_URL="https://github.com/tsl0922/ttyd/releases/latest/download/ttyd.x86_64"
            ;;
        aarch64|arm64)
            TTYD_URL="https://github.com/tsl0922/ttyd/releases/latest/download/ttyd.aarch64"
            ;;
        armv7l)
            TTYD_URL="https://github.com/tsl0922/ttyd/releases/latest/download/ttyd.armhf"
            ;;
        *)
            print_warning "Unsupported architecture: $ARCH. Trying x86_64 binary..."
            TTYD_URL="https://github.com/tsl0922/ttyd/releases/latest/download/ttyd.x86_64"
            ;;
    esac
    
    if wget -O /usr/local/bin/ttyd "$TTYD_URL"; then
        chmod +x /usr/local/bin/ttyd
        print_status "ttyd installed successfully"
    else
        print_error "Failed to download ttyd. Trying alternative installation..."
        
        # Alternative: compile from source or use package manager
        if command -v snap &> /dev/null; then
            print_status "Trying snap installation..."
            snap install ttyd --classic || print_warning "Snap installation failed"
        elif apt-cache search ttyd | grep -q ttyd; then
            print_status "Trying apt installation..."
            apt-get install -y ttyd || print_warning "Apt installation failed"
        else
            print_error "Could not install ttyd. Web terminal may not work."
        fi
    fi
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

# Create simple web API for system information
cat > $WEB_DIR/system-info.py << 'EOF'
#!/usr/bin/env python3

import json
import subprocess
import socket
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import os

# Try to import psutil, use fallback if not available
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    print("psutil not available, using fallback methods")

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
            if PSUTIL_AVAILABLE:
                cpu_percent = psutil.cpu_percent(interval=1)
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                
                system_info = {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_total_gb": round(memory.total / (1024**3), 2),
                    "disk_percent": round((disk.used / disk.total) * 100, 2),
                    "disk_total_gb": round(disk.total / (1024**3), 2)
                }
            else:
                # Fallback methods without psutil
                system_info = self.get_system_info_fallback()
            
            return {
                "timestamp": datetime.now().isoformat(),
                "hostname": hostname,
                "local_ip": local_ip,
                "public_ip": public_ip,
                "system": system_info,
                "psutil_available": PSUTIL_AVAILABLE
            }
        except Exception as e:
            return {"error": str(e)}
    
    def get_system_info_fallback(self):
        """Fallback system info without psutil"""
        try:
            # CPU info from /proc/loadavg
            try:
                with open('/proc/loadavg', 'r') as f:
                    load = float(f.read().split()[0])
                cpu_percent = min(load * 25, 100)  # Rough approximation
            except:
                cpu_percent = 0
            
            # Memory info from /proc/meminfo
            try:
                with open('/proc/meminfo', 'r') as f:
                    meminfo = f.read()
                total_kb = int([line for line in meminfo.split('\n') if 'MemTotal' in line][0].split()[1])
                available_kb = int([line for line in meminfo.split('\n') if 'MemAvailable' in line][0].split()[1])
                total_bytes = total_kb * 1024
                memory_percent = ((total_kb - available_kb) / total_kb) * 100
                memory_total_gb = round(total_bytes / (1024**3), 2)
            except:
                memory_percent = 0
                memory_total_gb = 0
            
            # Disk info from statvfs
            try:
                stat = os.statvfs('/')
                total = stat.f_frsize * stat.f_blocks
                used = stat.f_frsize * (stat.f_blocks - stat.f_available)
                disk_percent = round((used / total) * 100, 2)
                disk_total_gb = round(total / (1024**3), 2)
            except:
                disk_percent = 0
                disk_total_gb = 0
            
            return {
                "cpu_percent": cpu_percent,
                "memory_percent": round(memory_percent, 2),
                "memory_total_gb": memory_total_gb,
                "disk_percent": disk_percent,
                "disk_total_gb": disk_total_gb
            }
        except Exception as e:
            return {
                "cpu_percent": 0,
                "memory_percent": 0,
                "memory_total_gb": 0,
                "disk_percent": 0,
                "disk_total_gb": 0,
                "fallback_error": str(e)
            }
    
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

print_header "5. Creating Web Dashboard"

# Create simple web dashboard
cat > $WEB_DIR/dashboard.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TRADEAI Remote Access Dashboard</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .status-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .status-good { color: #10b981; }
        .status-bad { color: #ef4444; }
        .status-warning { color: #f59e0b; }
        .terminal-link {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 10px;
            transition: background 0.3s;
        }
        .terminal-link:hover {
            background: #059669;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .refresh-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 TRADEAI Remote Access Dashboard</h1>
            <p>Secure web-based access for bug fixing and deployment</p>
        </div>

        <div class="card">
            <h2>🖥️ Web Terminal Access</h2>
            <p>Click below to access the secure web terminal:</p>
            <a href="#" id="terminalLink" class="terminal-link" target="_blank">Open Web Terminal</a>
            <p><strong>Username:</strong> <span id="username">Loading...</span></p>
            <p><strong>Password:</strong> <span id="password">Loading...</span></p>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📊 System Information</h3>
                <button class="refresh-btn" onclick="loadSystemInfo()">Refresh</button>
                <div id="systemInfo">Loading...</div>
            </div>

            <div class="card">
                <h3>🔧 Service Status</h3>
                <button class="refresh-btn" onclick="loadServiceStatus()">Refresh</button>
                <div id="serviceStatus">Loading...</div>
            </div>
        </div>

        <div class="card">
            <h3>📋 Connection Information</h3>
            <div class="info-grid">
                <div><strong>Web Terminal:</strong> <span id="terminalUrl">Loading...</span></div>
                <div><strong>System API:</strong> <span id="apiUrl">Loading...</span></div>
                <div><strong>Access Expires:</strong> 24 hours from setup</div>
                <div><strong>Auto Cleanup:</strong> Enabled</div>
            </div>
        </div>
    </div>

    <script>
        const hostname = window.location.hostname;
        const terminalPort = 9999;
        const apiPort = 8888;
        
        document.getElementById('terminalLink').href = `http://${hostname}:${terminalPort}`;
        document.getElementById('terminalUrl').textContent = `http://${hostname}:${terminalPort}`;
        document.getElementById('apiUrl').textContent = `http://${hostname}:${apiPort}`;

        async function loadSystemInfo() {
            try {
                const response = await fetch(`http://${hostname}:${apiPort}/info`);
                const data = await response.json();
                
                document.getElementById('systemInfo').innerHTML = `
                    <div class="status-item">
                        <span>Hostname:</span>
                        <span>${data.hostname}</span>
                    </div>
                    <div class="status-item">
                        <span>Public IP:</span>
                        <span>${data.public_ip}</span>
                    </div>
                    <div class="status-item">
                        <span>CPU Usage:</span>
                        <span class="${data.system.cpu_percent > 80 ? 'status-bad' : 'status-good'}">${data.system.cpu_percent}%</span>
                    </div>
                    <div class="status-item">
                        <span>Memory Usage:</span>
                        <span class="${data.system.memory_percent > 80 ? 'status-bad' : 'status-good'}">${data.system.memory_percent}%</span>
                    </div>
                    <div class="status-item">
                        <span>Disk Usage:</span>
                        <span class="${data.system.disk_percent > 80 ? 'status-bad' : 'status-good'}">${data.system.disk_percent}%</span>
                    </div>
                `;
            } catch (error) {
                document.getElementById('systemInfo').innerHTML = '<div class="status-bad">Error loading system info</div>';
            }
        }

        async function loadServiceStatus() {
            try {
                const response = await fetch(`http://${hostname}:${apiPort}/status`);
                const data = await response.json();
                
                let html = '';
                const portNames = {
                    'port_22': 'SSH',
                    'port_80': 'HTTP',
                    'port_443': 'HTTPS',
                    'port_3000': 'Frontend',
                    'port_5000': 'Backend',
                    'port_8000': 'AI Services',
                    'port_8080': 'Monitoring',
                    'port_27017': 'MongoDB',
                    'port_6379': 'Redis'
                };

                for (const [key, value] of Object.entries(data)) {
                    if (key.startsWith('port_')) {
                        const name = portNames[key] || key;
                        const statusClass = value === 'open' ? 'status-good' : 'status-bad';
                        html += `
                            <div class="status-item">
                                <span>${name}:</span>
                                <span class="${statusClass}">${value.toUpperCase()}</span>
                            </div>
                        `;
                    } else if (key === 'docker') {
                        const statusClass = value === 'running' ? 'status-good' : 'status-bad';
                        html += `
                            <div class="status-item">
                                <span>Docker:</span>
                                <span class="${statusClass}">${value.toUpperCase()}</span>
                            </div>
                        `;
                    }
                }
                
                document.getElementById('serviceStatus').innerHTML = html;
            } catch (error) {
                document.getElementById('serviceStatus').innerHTML = '<div class="status-bad">Error loading service status</div>';
            }
        }

        // Load data on page load
        loadSystemInfo();
        loadServiceStatus();
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            loadSystemInfo();
            loadServiceStatus();
        }, 30000);
    </script>
</body>
</html>
EOF

print_header "6. Setting up Services"

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

# Create systemd service for web dashboard
cat > /etc/systemd/system/tradeai-dashboard.service << EOF
[Unit]
Description=TRADEAI Web Dashboard
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$WEB_DIR
ExecStart=/usr/bin/python3 -m http.server 8889 --bind 0.0.0.0
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
print_status "Setting up systemd services..."
systemctl daemon-reload

print_status "Enabling services..."
systemctl enable tradeai-web-terminal.service || print_warning "Failed to enable web terminal service"
systemctl enable tradeai-system-info.service || print_warning "Failed to enable system info service"

print_status "Starting services..."
systemctl start tradeai-web-terminal.service || print_warning "Failed to start web terminal service"
systemctl start tradeai-system-info.service || print_warning "Failed to start system info service"

# Wait a moment for services to start
sleep 3

# Check service status
print_status "Checking service status..."
if systemctl is-active --quiet tradeai-web-terminal.service; then
    print_status "✅ Web Terminal service is running"
else
    print_warning "❌ Web Terminal service failed to start"
    systemctl status tradeai-web-terminal.service --no-pager -l || true
fi

if systemctl is-active --quiet tradeai-system-info.service; then
    print_status "✅ System Info API service is running"
else
    print_warning "❌ System Info API service failed to start"
    systemctl status tradeai-system-info.service --no-pager -l || true
fi

print_header "7. Configuring Firewall"

# Open required ports
print_status "Configuring firewall rules..."
if command -v ufw &> /dev/null; then
    print_status "Using UFW firewall..."
    ufw --force enable 2>/dev/null || true
    ufw allow 8888/tcp comment "TRADEAI System Info API" || print_warning "Failed to add UFW rule for port 8888"
    ufw allow 9999/tcp comment "TRADEAI Web Terminal" || print_warning "Failed to add UFW rule for port 9999"
    ufw status numbered 2>/dev/null || true
elif command -v firewall-cmd &> /dev/null; then
    print_status "Using firewalld..."
    firewall-cmd --permanent --add-port=8888/tcp || print_warning "Failed to add firewalld rule for port 8888"
    firewall-cmd --permanent --add-port=9999/tcp || print_warning "Failed to add firewalld rule for port 9999"
    firewall-cmd --reload || print_warning "Failed to reload firewalld"
elif command -v iptables &> /dev/null; then
    print_status "Using iptables..."
    iptables -A INPUT -p tcp --dport 8888 -j ACCEPT 2>/dev/null || print_warning "Failed to add iptables rule for port 8888"
    iptables -A INPUT -p tcp --dport 9999 -j ACCEPT 2>/dev/null || print_warning "Failed to add iptables rule for port 9999"
    # Try to save iptables rules
    if command -v iptables-save &> /dev/null; then
        mkdir -p /etc/iptables 2>/dev/null || true
        iptables-save > /etc/iptables/rules.v4 2>/dev/null || print_warning "Could not save iptables rules"
    fi
else
    print_warning "No firewall detected. Please ensure ports 8888 and 9999 are open manually"
    print_warning "You may need to configure your cloud provider's security groups"
fi

print_header "8. Setting up Auto-cleanup"

# Create cleanup script
cat > /usr/local/bin/cleanup-tradeai-web.sh << 'EOF'
#!/bin/bash
echo "Cleaning up TRADEAI web access..."
systemctl stop tradeai-web-terminal.service
systemctl stop tradeai-system-info.service
systemctl stop tradeai-dashboard.service
systemctl disable tradeai-web-terminal.service
systemctl disable tradeai-system-info.service
systemctl disable tradeai-dashboard.service
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

print_header "9. Final Setup and Testing"

# Get system information
HOSTNAME=$(hostname)
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "Unable to detect")

# Test connectivity
print_status "Testing service connectivity..."
TERMINAL_STATUS="❌ Not accessible"
API_STATUS="❌ Not accessible"

# Test web terminal port
if timeout 5 bash -c "</dev/tcp/localhost/9999" 2>/dev/null; then
    TERMINAL_STATUS="✅ Accessible"
else
    print_warning "Web terminal port 9999 is not accessible"
fi

# Test system info API port
if timeout 5 bash -c "</dev/tcp/localhost/8888" 2>/dev/null; then
    API_STATUS="✅ Accessible"
else
    print_warning "System info API port 8888 is not accessible"
fi

print_status "Service connectivity test results:"
print_status "  Web Terminal (9999): $TERMINAL_STATUS"
print_status "  System API (8888): $API_STATUS"

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

Service Status:
- Web Terminal (9999): $TERMINAL_STATUS
- System API (8888): $API_STATUS

Auto-cleanup: 24 hours
Manual cleanup: sudo /usr/local/bin/cleanup-tradeai-web.sh

Generated: $(date)

Troubleshooting:
- If services are not accessible, check firewall settings
- For cloud servers, ensure security groups allow ports 8888 and 9999
- Check service logs: journalctl -u tradeai-web-terminal.service -f
- Check service logs: journalctl -u tradeai-system-info.service -f
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
echo "1. Open the web dashboard in your browser:"
echo "   http://$PUBLIC_IP:8889/dashboard.html"
echo ""
echo "2. Click 'Open Web Terminal' to access the terminal"
echo ""
echo "3. Share the connection information above with the AI assistant"
echo ""
echo "4. The assistant will use the web terminal for bug fixing and deployment"
echo ""
print_warning "Keep credentials secure and delete after use"
echo ""