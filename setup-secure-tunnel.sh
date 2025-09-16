#!/bin/bash

# TRADEAI Secure Tunnel Setup Script
# Creates a secure reverse SSH tunnel for remote assistance
# More secure alternative to direct SSH access

set -e

echo "🔐 TRADEAI Secure Tunnel Setup"
echo "=============================="
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

print_header "1. Installing Required Packages"

# Update and install required packages
apt-get update -y
apt-get install -y openssh-client curl wget jq

print_header "2. Setting up Secure Tunnel User"

# Create tunnel user
TUNNEL_USER="tradeai_tunnel"
if id "$TUNNEL_USER" &>/dev/null; then
    print_warning "User $TUNNEL_USER already exists. Removing..."
    userdel -r $TUNNEL_USER 2>/dev/null || true
fi

useradd -m -s /bin/bash $TUNNEL_USER
usermod -aG sudo $TUNNEL_USER
usermod -aG docker $TUNNEL_USER 2>/dev/null || true

print_header "3. Generating SSH Keys"

USER_HOME="/home/$TUNNEL_USER"
SSH_DIR="$USER_HOME/.ssh"
mkdir -p $SSH_DIR
chmod 700 $SSH_DIR

# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -f "$SSH_DIR/tunnel_key" -N "" -C "tradeai-tunnel@$(date +%Y%m%d)"
chmod 600 "$SSH_DIR/tunnel_key"
chmod 644 "$SSH_DIR/tunnel_key.pub"
chown -R $TUNNEL_USER:$TUNNEL_USER $SSH_DIR

print_header "4. Creating Tunnel Configuration"

# Get system information
HOSTNAME=$(hostname)
LOCAL_IP=$(hostname -I | awk '{print $1}')
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "Unable to detect")

# Create tunnel configuration
TUNNEL_CONFIG="$USER_HOME/tunnel_config.json"
cat > $TUNNEL_CONFIG << EOF
{
  "server_info": {
    "hostname": "$HOSTNAME",
    "local_ip": "$LOCAL_IP",
    "public_ip": "$PUBLIC_IP",
    "os": "$(cat /etc/os-release | grep PRETTY_NAME | cut -d'\"' -f2)",
    "docker_version": "$(docker --version 2>/dev/null || echo 'Not installed')",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  },
  "tunnel_info": {
    "user": "$TUNNEL_USER",
    "ssh_key_path": "$SSH_DIR/tunnel_key",
    "public_key": "$(cat $SSH_DIR/tunnel_key.pub)"
  },
  "services": {
    "frontend": 3000,
    "backend": 5000,
    "ai_services": 8000,
    "monitoring": 8080,
    "mongodb": 27017,
    "redis": 6379
  }
}
EOF

chown $TUNNEL_USER:$TUNNEL_USER $TUNNEL_CONFIG

print_header "5. Creating Tunnel Scripts"

# Create tunnel establishment script
TUNNEL_SCRIPT="$USER_HOME/establish_tunnel.sh"
cat > $TUNNEL_SCRIPT << 'EOF'
#!/bin/bash

# This script establishes a reverse SSH tunnel
# Usage: ./establish_tunnel.sh <remote_server> <remote_port>

REMOTE_SERVER=${1:-"tunnel.example.com"}
REMOTE_PORT=${2:-"2222"}
LOCAL_PORTS="22:localhost:22 3000:localhost:3000 5000:localhost:5000 8000:localhost:8000 8080:localhost:8080"

echo "Establishing reverse SSH tunnel to $REMOTE_SERVER:$REMOTE_PORT"
echo "Local services will be accessible through the tunnel"

# Create SSH config for tunnel
SSH_CONFIG="$HOME/.ssh/config"
cat > $SSH_CONFIG << SSHEOF
Host tunnel-server
    HostName $REMOTE_SERVER
    Port $REMOTE_PORT
    User tunnel
    IdentityFile $HOME/.ssh/tunnel_key
    StrictHostKeyChecking no
    ServerAliveInterval 60
    ServerAliveCountMax 3
SSHEOF

# Establish tunnel with port forwarding
ssh -N -R 2222:localhost:22 \
    -R 3000:localhost:3000 \
    -R 5000:localhost:5000 \
    -R 8000:localhost:8000 \
    -R 8080:localhost:8080 \
    -R 27017:localhost:27017 \
    -R 6379:localhost:6379 \
    tunnel-server
EOF

chmod +x $TUNNEL_SCRIPT
chown $TUNNEL_USER:$TUNNEL_USER $TUNNEL_SCRIPT

print_header "6. Creating Status Check Script"

STATUS_SCRIPT="$USER_HOME/check_status.sh"
cat > $STATUS_SCRIPT << 'EOF'
#!/bin/bash

echo "TRADEAI System Status Check"
echo "=========================="
echo ""

# System info
echo "System Information:"
echo "  Hostname: $(hostname)"
echo "  IP Address: $(hostname -I | awk '{print $1}')"
echo "  Uptime: $(uptime -p)"
echo "  Load: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

# Docker status
echo "Docker Status:"
if command -v docker &> /dev/null; then
    echo "  Docker: $(docker --version)"
    echo "  Running containers: $(docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null || echo 'None')"
else
    echo "  Docker: Not installed"
fi
echo ""

# Service ports
echo "Service Ports:"
for port in 22 80 443 3000 5000 8000 8080 27017 6379; do
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        echo "  Port $port: OPEN"
    else
        echo "  Port $port: CLOSED"
    fi
done
echo ""

# TRADEAI specific checks
echo "TRADEAI Status:"
if [ -d "/opt/tradeai" ]; then
    echo "  Project directory: EXISTS"
else
    echo "  Project directory: NOT FOUND"
fi

if [ -f "docker-compose.yml" ]; then
    echo "  Docker Compose config: EXISTS"
    echo "  Services defined: $(grep -c 'container_name:' docker-compose.yml 2>/dev/null || echo 'Unknown')"
else
    echo "  Docker Compose config: NOT FOUND"
fi
EOF

chmod +x $STATUS_SCRIPT
chown $TUNNEL_USER:$TUNNEL_USER $STATUS_SCRIPT

print_header "7. Setting up Auto-cleanup"

# Create cleanup script
CLEANUP_SCRIPT="/usr/local/bin/cleanup-tradeai-tunnel.sh"
cat > $CLEANUP_SCRIPT << 'EOF'
#!/bin/bash
echo "Cleaning up TRADEAI tunnel access..."
pkill -f "ssh.*tunnel-server" 2>/dev/null || true
userdel -r tradeai_tunnel 2>/dev/null || true
rm -f /etc/cron.d/tradeai-tunnel-cleanup
rm -f /usr/local/bin/cleanup-tradeai-tunnel.sh
echo "Cleanup completed"
EOF

chmod +x $CLEANUP_SCRIPT

# Set up auto-cleanup (24 hours)
cat > /etc/cron.d/tradeai-tunnel-cleanup << EOF
# Remove TRADEAI tunnel user after 24 hours
0 */24 * * * root $CLEANUP_SCRIPT
EOF

print_header "8. Generating Connection Package"

# Create connection package
PACKAGE_DIR="/tmp/tradeai_connection_package"
mkdir -p $PACKAGE_DIR

# Copy necessary files
cp $SSH_DIR/tunnel_key $PACKAGE_DIR/
cp $SSH_DIR/tunnel_key.pub $PACKAGE_DIR/
cp $TUNNEL_CONFIG $PACKAGE_DIR/
cp $STATUS_SCRIPT $PACKAGE_DIR/

# Create README for the package
cat > $PACKAGE_DIR/README.md << 'EOF'
# TRADEAI Connection Package

This package contains the necessary files for secure remote access to your TRADEAI server.

## Files Included:
- `tunnel_key`: Private SSH key for tunnel connection
- `tunnel_key.pub`: Public SSH key
- `tunnel_config.json`: Server configuration and connection details
- `check_status.sh`: System status check script

## Security Notes:
- This access is temporary (24 hours)
- All connections are encrypted via SSH
- Access will be automatically cleaned up
- Monitor access in system logs

## Manual Cleanup:
If you need to remove access immediately:
```bash
sudo /usr/local/bin/cleanup-tradeai-tunnel.sh
```
EOF

# Create archive
cd /tmp
tar -czf tradeai_connection_package.tar.gz tradeai_connection_package/
chmod 600 tradeai_connection_package.tar.gz

print_status "Connection package created: /tmp/tradeai_connection_package.tar.gz"

print_header "9. Final Setup"

echo ""
echo "================================================"
echo "🔐 SECURE TUNNEL SETUP COMPLETED"
echo "================================================"
echo ""
echo "Connection Information:"
echo "  Server: $HOSTNAME ($PUBLIC_IP)"
echo "  Tunnel User: $TUNNEL_USER"
echo "  SSH Key: $SSH_DIR/tunnel_key"
echo ""
echo "Connection Package: /tmp/tradeai_connection_package.tar.gz"
echo ""
echo "To share connection details securely:"
echo "1. Download the connection package:"
echo "   scp root@$PUBLIC_IP:/tmp/tradeai_connection_package.tar.gz ."
echo ""
echo "2. Or display the configuration:"
echo "   cat $TUNNEL_CONFIG"
echo ""
echo "Auto-cleanup: 24 hours"
echo "Manual cleanup: sudo /usr/local/bin/cleanup-tradeai-tunnel.sh"
echo ""
print_warning "Keep connection details secure and delete after use"
echo ""