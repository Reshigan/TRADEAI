#!/bin/bash

# TRADEAI Quick Deployment Script
# This script performs a complete clean installation of TRADEAI

set -e  # Exit on any error

echo "🚀 TRADEAI Quick Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Check for sudo privileges
if ! sudo -n true 2>/dev/null; then
    print_error "This script requires sudo privileges. Please run: sudo -v"
    exit 1
fi

print_status "Starting TRADEAI deployment..."

# Step 1: System cleanup and updates
print_status "Step 1: Cleaning up system and updating packages..."

# Stop existing services
print_status "Stopping existing services..."
sudo systemctl stop mongod 2>/dev/null || true
sudo systemctl stop redis-server 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Clean Docker if installed
if command -v docker &> /dev/null; then
    print_status "Cleaning existing Docker containers and images..."
    docker stop $(docker ps -aq) 2>/dev/null || true
    docker rm $(docker ps -aq) 2>/dev/null || true
    docker system prune -af --volumes 2>/dev/null || true
fi

# Update system
print_status "Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Install essential packages
print_status "Installing essential packages..."
sudo apt-get install -y -qq curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Step 2: Install Docker
print_status "Step 2: Installing Docker..."

if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_success "Docker installed successfully"
else
    print_success "Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose already installed"
fi

# Start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Step 3: Install Node.js
print_status "Step 3: Installing Node.js..."

if ! command -v node &> /dev/null || [[ $(node --version | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    print_status "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js $(node --version) installed successfully"
else
    print_success "Node.js $(node --version) already installed"
fi

# Step 4: Setup environment
print_status "Step 4: Setting up environment..."

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    print_status "Creating environment configuration..."
    cp backend/.env.example backend/.env
    
    # Generate secure JWT secrets
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    
    # Update .env with secure values
    sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" backend/.env
    sed -i "s/your-refresh-secret-key-change-this-in-production/$JWT_REFRESH_SECRET/" backend/.env
    
    print_success "Environment configuration created with secure JWT secrets"
else
    print_success "Environment configuration already exists"
fi

# Make scripts executable
chmod +x *.sh

# Step 5: Deploy with Docker
print_status "Step 5: Deploying TRADEAI with Docker..."

# Build and start services
print_status "Building and starting services..."
docker-compose down 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    print_error "Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

print_success "All services are running"

# Step 6: Initialize database
print_status "Step 6: Initializing database..."

# Wait a bit more for MongoDB to be fully ready
sleep 10

# Run production seed
print_status "Seeding production data..."
if docker-compose exec -T backend npm run seed:production; then
    print_success "Production data seeded successfully"
else
    print_warning "Database seeding failed. You may need to run it manually later."
fi

# Step 7: Verification
print_status "Step 7: Verifying installation..."

# Check service health
print_status "Checking service health..."

# Backend health check
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    print_success "Backend service is healthy"
else
    print_warning "Backend service health check failed"
fi

# Frontend check
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_success "Frontend service is accessible"
else
    print_warning "Frontend service check failed"
fi

# Display service status
print_status "Service Status:"
docker-compose ps

# Step 8: Final instructions
echo ""
echo "🎉 TRADEAI Deployment Complete!"
echo "==============================="
echo ""
echo "📍 Access Points:"
echo "  • Frontend:    http://$(hostname -I | awk '{print $1}'):3001"
echo "  • Backend API: http://$(hostname -I | awk '{print $1}'):5001"
echo "  • AI Services: http://$(hostname -I | awk '{print $1}'):8000"
echo "  • Monitoring:  http://$(hostname -I | awk '{print $1}'):8081"
echo ""
echo "🔑 Default Login Credentials:"
echo "  GONXT Admin:"
echo "    Email: admin@gonxt.tech"
echo "    Password: GonxtAdmin2024!"
echo ""
echo "  Test Company Admin:"
echo "    Email: admin@test.demo"
echo "    Password: TestAdmin2024!"
echo ""
echo "📋 Useful Commands:"
echo "  • View logs:        docker-compose logs -f"
echo "  • Restart services: docker-compose restart"
echo "  • Stop services:    docker-compose down"
echo "  • Health check:     ./health-check.sh (if created)"
echo ""
echo "📖 For detailed documentation, see: CLEAN_INSTALL_KIT.md"
echo ""

# Create a simple health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "🔍 TRADEAI Health Check"
echo "======================="
echo "Docker Containers:"
docker-compose ps
echo ""
echo "Service Health:"
curl -s http://localhost:5001/health && echo " ✅ Backend OK" || echo " ❌ Backend Failed"
curl -s http://localhost:3001 > /dev/null && echo " ✅ Frontend OK" || echo " ❌ Frontend Failed"
curl -s http://localhost:8000/health > /dev/null && echo " ✅ AI Services OK" || echo " ❌ AI Services Failed"
curl -s http://localhost:8081/health > /dev/null && echo " ✅ Monitoring OK" || echo " ❌ Monitoring Failed"
EOF

chmod +x health-check.sh

print_success "Deployment completed successfully!"
print_status "You may need to log out and back in for Docker group membership to take effect."

# Check if user needs to re-login for Docker group
if ! groups | grep -q docker; then
    print_warning "Please log out and back in, or run 'newgrp docker' to use Docker without sudo."
fi

echo ""
print_status "Run './health-check.sh' to verify all services are working correctly."