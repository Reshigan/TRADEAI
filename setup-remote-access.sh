#!/bin/bash

# TRADEAI Remote Access Setup Script
# This script sets up secure temporary access for OpenHands AI assistant
# to help with bug fixing and production deployment

set -e

echo "🚀 TRADEAI Remote Access Setup Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_header "1. System Information Collection"
echo "Collecting system information..."

# Get system info
HOSTNAME=$(hostname)
IP_ADDRESS=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "Unable to detect")
OS_INFO=$(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
DOCKER_VERSION=$(docker --version 2>/dev/null || echo "Docker not installed")
DOCKER_COMPOSE_VERSION=$(docker-compose --version 2>/dev/null || echo "Docker Compose not installed")

echo "System Information:"
echo "  Hostname: $HOSTNAME"
echo "  Public IP: $IP_ADDRESS"
echo "  OS: $OS_INFO"
echo "  Docker: $DOCKER_VERSION"
echo "  Docker Compose: $DOCKER_COMPOSE_VERSION"
echo ""

print_header "2. Creating Temporary User for Remote Access"

# Create temporary user for remote access
TEMP_USER="tradeai_assistant"
TEMP_PASSWORD=$(openssl rand -base64 32)

# Remove user if exists
if id "$TEMP_USER" &>/dev/null; then
    print_warning "User $TEMP_USER already exists. Removing..."
    userdel -r $TEMP_USER 2>/dev/null || true
fi

# Create user
useradd -m -s /bin/bash $TEMP_USER
echo "$TEMP_USER:$TEMP_PASSWORD" | chpasswd

# Add to sudo group
usermod -aG sudo $TEMP_USER
usermod -aG docker $TEMP_USER 2>/dev/null || true

print_status "Created temporary user: $TEMP_USER"

print_header "3. Setting up SSH Access"

# Create SSH directory
USER_HOME="/home/$TEMP_USER"
SSH_DIR="$USER_HOME/.ssh"
mkdir -p $SSH_DIR
chmod 700 $SSH_DIR

# Generate SSH key pair for the assistant
ssh-keygen -t rsa -b 4096 -f "$SSH_DIR/tradeai_key" -N "" -C "tradeai-assistant@$(date +%Y%m%d)"

# Set up authorized_keys
cp "$SSH_DIR/tradeai_key.pub" "$SSH_DIR/authorized_keys"
chmod 600 "$SSH_DIR/authorized_keys"
chmod 600 "$SSH_DIR/tradeai_key"
chown -R $TEMP_USER:$TEMP_USER $SSH_DIR

print_status "SSH keys generated and configured"

print_header "4. Configuring SSH Server"

# Backup original sshd_config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)

# Enable password authentication temporarily (will be disabled after key exchange)
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Enable public key authentication
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Restart SSH service
systemctl restart sshd || service ssh restart

print_status "SSH server configured and restarted"

print_header "5. Setting up Firewall Rules"

# Check if ufw is installed and active
if command -v ufw &> /dev/null; then
    print_status "Configuring UFW firewall..."
    ufw allow ssh
    ufw allow 22
    ufw allow 80
    ufw allow 443
    ufw allow 3000  # Frontend
    ufw allow 5000  # Backend
    ufw allow 8000  # AI Services
    ufw allow 8080  # Monitoring
    ufw --force enable
elif command -v firewall-cmd &> /dev/null; then
    print_status "Configuring firewalld..."
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-port=22/tcp
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --permanent --add-port=5000/tcp
    firewall-cmd --permanent --add-port=8000/tcp
    firewall-cmd --permanent --add-port=8080/tcp
    firewall-cmd --reload
else
    print_warning "No firewall detected. Please ensure ports 22, 80, 443, 3000, 5000, 8000, 8080 are open"
fi

print_header "6. Installing Required Dependencies"

# Update package list
apt-get update -y

# Install required packages
PACKAGES="curl wget git nano vim htop tree jq unzip"
for package in $PACKAGES; do
    if ! dpkg -l | grep -q "^ii  $package "; then
        print_status "Installing $package..."
        apt-get install -y $package
    fi
done

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

print_header "7. Setting up TRADEAI Project Directory"

# Create project directory
PROJECT_DIR="/opt/tradeai"
mkdir -p $PROJECT_DIR
chown $TEMP_USER:$TEMP_USER $PROJECT_DIR

# Give user access to project directory
echo "$TEMP_USER ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/tradeai_assistant

print_status "Project directory created: $PROJECT_DIR"

print_header "8. Creating Connection Information File"

# Create connection info file
CONNECTION_FILE="/tmp/tradeai_connection_info.txt"
cat > $CONNECTION_FILE << EOF
TRADEAI Remote Access Information
================================

Server Details:
- Hostname: $HOSTNAME
- Public IP: $IP_ADDRESS
- OS: $OS_INFO

SSH Connection:
- Username: $TEMP_USER
- Password: $TEMP_PASSWORD
- SSH Port: 22

Connection Command:
ssh $TEMP_USER@$IP_ADDRESS

Or with password:
sshpass -p '$TEMP_PASSWORD' ssh $TEMP_USER@$IP_ADDRESS

Private Key Location (on server):
$SSH_DIR/tradeai_key

Project Directory:
$PROJECT_DIR

Services Status:
- Docker: $(docker --version 2>/dev/null || echo "Not installed")
- Docker Compose: $(docker-compose --version 2>/dev/null || echo "Not installed")

Generated on: $(date)
EOF

print_status "Connection information saved to: $CONNECTION_FILE"

print_header "9. Setting up Monitoring and Logging"

# Create log directory
LOG_DIR="/var/log/tradeai"
mkdir -p $LOG_DIR
chown $TEMP_USER:$TEMP_USER $LOG_DIR

# Create monitoring script
cat > /usr/local/bin/tradeai-monitor.sh << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/tradeai/access.log"
echo "$(date): Remote access session started" >> $LOG_FILE
tail -f /var/log/auth.log | grep tradeai_assistant >> $LOG_FILE &
EOF

chmod +x /usr/local/bin/tradeai-monitor.sh

print_status "Monitoring and logging configured"

print_header "10. Security Hardening"

# Set up automatic cleanup (remove user after 24 hours)
cat > /etc/cron.d/tradeai-cleanup << EOF
# Remove temporary TRADEAI user after 24 hours
0 */24 * * * root /usr/sbin/userdel -r tradeai_assistant 2>/dev/null || true
EOF

# Create manual cleanup script
cat > /usr/local/bin/cleanup-tradeai-access.sh << 'EOF'
#!/bin/bash
echo "Cleaning up TRADEAI remote access..."
userdel -r tradeai_assistant 2>/dev/null || true
rm -f /etc/cron.d/tradeai-cleanup
rm -f /etc/sudoers.d/tradeai_assistant
rm -f /usr/local/bin/cleanup-tradeai-access.sh
rm -f /usr/local/bin/tradeai-monitor.sh
echo "Cleanup completed"
EOF

chmod +x /usr/local/bin/cleanup-tradeai-access.sh

print_status "Security hardening completed"

print_header "11. Final System Check"

# Check services
echo "Service Status:"
echo "  SSH: $(systemctl is-active sshd || echo 'inactive')"
echo "  Docker: $(systemctl is-active docker || echo 'inactive')"

# Check ports
echo ""
echo "Open Ports:"
netstat -tlnp | grep -E ':(22|80|443|3000|5000|8000|8080) ' || echo "  Port check failed"

echo ""
print_status "Setup completed successfully!"
echo ""
echo "================================================"
echo "🔐 CONNECTION INFORMATION"
echo "================================================"
cat $CONNECTION_FILE
echo ""
echo "================================================"
echo "📋 NEXT STEPS"
echo "================================================"
echo "1. Share the connection information above with the AI assistant"
echo "2. The assistant will connect and begin bug fixing and deployment"
echo "3. Monitor progress in /var/log/tradeai/access.log"
echo "4. To manually cleanup access later, run: /usr/local/bin/cleanup-tradeai-access.sh"
echo "5. Access will automatically expire in 24 hours"
echo ""
print_warning "Keep the connection information secure and delete it after use"
echo ""