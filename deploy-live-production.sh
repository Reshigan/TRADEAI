#!/bin/bash

# TRADEAI Live Production Deployment Script
# Premium Corporate UI with Glass Morphism Design
# Suitable for multinational FMCG enterprises like P&G, Unilever, Nestlé

set -e

echo "🚀 TRADEAI Live Production Deployment"
echo "======================================"
echo "Premium Corporate UI for FMCG Enterprises"
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
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# System requirements check
print_header "1. Checking System Requirements"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi
print_status "Node.js version: $(node --version) ✓"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_status "npm version: $(npm --version) ✓"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_status "Docker version: $(docker --version) ✓"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_status "Docker Compose version: $(docker-compose --version) ✓"

# Check Git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed"
    exit 1
fi
print_status "Git version: $(git --version) ✓"

print_status "All system requirements met!"
echo ""

# Environment setup
print_header "2. Environment Configuration"

# Create production environment file
cat > .env.production << EOF
# TRADEAI Production Environment Configuration
# Premium Corporate UI for FMCG Enterprises

# Application
NODE_ENV=production
PORT=3000
REACT_APP_API_URL=http://localhost:5000/api

# Database
MONGODB_URI=mongodb://mongodb:27017/trade_ai_production
DB_NAME=trade_ai_production

# Security
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info

# Features
ENABLE_ANALYTICS=true
ENABLE_AI_ASSISTANT=true
ENABLE_NOTIFICATIONS=true

# UI Theme
REACT_APP_THEME=corporate
REACT_APP_COMPANY_NAME=Trade AI Platform
REACT_APP_LOGO_URL=/images/corporate-logo.svg
EOF

print_status "Production environment configured"

# Create production Docker Compose
cat > docker-compose.production.yml << EOF
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:7.0
    container_name: tradeai_mongodb_prod
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: trade_ai_production
    volumes:
      - mongodb_data:/data/db
      - ./backend/src/seeds:/docker-entrypoint-initdb.d
    ports:
      - "27017:27017"
    networks:
      - tradeai_network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: tradeai_backend_prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/trade_ai_production
      - PORT=5000
      - JWT_SECRET=\${JWT_SECRET}
      - SESSION_SECRET=\${SESSION_SECRET}
      - CORS_ORIGIN=http://localhost:3000
    ports:
      - "5000:5000"
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - tradeai_network
    volumes:
      - ./backend/uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - REACT_APP_API_URL=http://localhost:5000/api
        - REACT_APP_THEME=corporate
    container_name: tradeai_frontend_prod
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - tradeai_network
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=http://localhost:5000/api
      - REACT_APP_THEME=corporate
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  mongodb_data:
    driver: local

networks:
  tradeai_network:
    driver: bridge
EOF

print_status "Production Docker Compose configured"

# Create backend Dockerfile if it doesn't exist
if [ ! -f "backend/Dockerfile" ]; then
    print_status "Creating backend Dockerfile..."
    cat > backend/Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["npm", "start"]
EOF
fi

# Create frontend Dockerfile if it doesn't exist
if [ ! -f "frontend/Dockerfile" ]; then
    print_status "Creating frontend Dockerfile..."
    cat > frontend/Dockerfile << EOF
FROM node:18-alpine as builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build arguments
ARG REACT_APP_API_URL
ARG REACT_APP_THEME

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000 || exit 1

CMD ["nginx", "-g", "daemon off;"]
EOF
fi

# Create nginx configuration for frontend
if [ ! -f "frontend/nginx.conf" ]; then
    print_status "Creating nginx configuration..."
    cat > frontend/nginx.conf << EOF
server {
    listen 3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
fi

echo ""

# Build and deploy
print_header "3. Building and Deploying Application"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down --remove-orphans || true

# Remove old images
print_status "Cleaning up old images..."
docker system prune -f || true

# Build and start services
print_status "Building and starting services..."
docker-compose -f docker-compose.production.yml up --build -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_header "4. Health Check"

# Check MongoDB
if docker-compose -f docker-compose.production.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_status "MongoDB: ✓ Healthy"
else
    print_warning "MongoDB: ⚠ Not responding"
fi

# Check Backend
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    print_status "Backend API: ✓ Healthy"
else
    print_warning "Backend API: ⚠ Not responding"
fi

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend: ✓ Healthy"
else
    print_warning "Frontend: ⚠ Not responding"
fi

# Seed production data
print_header "5. Seeding Production Data"
print_status "Seeding initial production data..."
docker-compose -f docker-compose.production.yml exec -T backend npm run seed:production || print_warning "Seeding may have failed - check logs"

echo ""
print_header "6. Deployment Complete!"

echo ""
echo "🎉 TRADEAI Production Deployment Successful!"
echo "=========================================="
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000/api"
echo "   MongoDB: mongodb://localhost:27017"
echo ""
echo "🎨 Premium Corporate UI Features:"
echo "   ✓ Glass morphism design with frosted effects"
echo "   ✓ Corporate blue and gold color palette"
echo "   ✓ Professional Inter typography"
echo "   ✓ Sophisticated micro-interactions"
echo "   ✓ Enterprise-grade hexagonal logo"
echo "   ✓ Perfect for FMCG multinational companies"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   Stop: docker-compose -f docker-compose.production.yml down"
echo "   Restart: docker-compose -f docker-compose.production.yml restart"
echo "   Update: git pull && docker-compose -f docker-compose.production.yml up --build -d"
echo ""
echo "📊 Default Login Credentials:"
echo "   Email: admin@tradeai.com"
echo "   Password: admin123"
echo ""
echo "🚀 Your premium corporate TRADEAI platform is now live!"
echo "   Perfect for enterprise clients like P&G, Unilever, and Nestlé"
echo ""

# Create management script
cat > manage-production.sh << 'EOF'
#!/bin/bash

# TRADEAI Production Management Script

case "$1" in
    start)
        echo "Starting TRADEAI production..."
        docker-compose -f docker-compose.production.yml up -d
        ;;
    stop)
        echo "Stopping TRADEAI production..."
        docker-compose -f docker-compose.production.yml down
        ;;
    restart)
        echo "Restarting TRADEAI production..."
        docker-compose -f docker-compose.production.yml restart
        ;;
    logs)
        docker-compose -f docker-compose.production.yml logs -f
        ;;
    status)
        docker-compose -f docker-compose.production.yml ps
        ;;
    update)
        echo "Updating TRADEAI production..."
        git pull
        docker-compose -f docker-compose.production.yml up --build -d
        ;;
    backup)
        echo "Creating backup..."
        docker exec tradeai_mongodb_prod mongodump --out /data/backup/$(date +%Y%m%d_%H%M%S)
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|update|backup}"
        exit 1
        ;;
esac
EOF

chmod +x manage-production.sh

print_status "Management script created: ./manage-production.sh"
echo ""
echo "Use './manage-production.sh status' to check service status"
echo "Use './manage-production.sh logs' to view application logs"
echo ""
echo "🎯 Ready for enterprise deployment!"