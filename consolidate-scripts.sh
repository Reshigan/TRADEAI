#!/bin/bash

###############################################################################
# TRADEAI - Script Consolidation Helper
# 
# This script helps organize the 50+ deployment scripts into a clean structure
# 
# Usage: ./consolidate-scripts.sh
###############################################################################

set -e

echo "=========================================="
echo "TRADEAI Script Consolidation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create organized directory structure
echo -e "${GREEN}Creating organized script directories...${NC}"
mkdir -p scripts/{deploy,backup,maintenance,monitoring,database}

echo ""
echo -e "${YELLOW}Analyzing existing deployment scripts...${NC}"
echo ""

# Count scripts
total_scripts=$(find . -maxdepth 1 -name "*.sh" -type f | wc -l)
echo "Found $total_scripts shell scripts in root directory"
echo ""

# Show categorization plan
echo -e "${GREEN}Suggested organization:${NC}"
echo ""
echo "scripts/"
echo "├── deploy/"
echo "│   ├── production.sh      - Main production deployment"
echo "│   ├── staging.sh          - Staging deployment"
echo "│   ├── development.sh      - Development setup"
echo "│   ├── rollback.sh         - Rollback to previous version"
echo "│   └── health-check.sh     - Post-deployment health checks"
echo "├── backup/"
echo "│   ├── backup-db.sh        - Database backup"
echo "│   ├── backup-files.sh     - File system backup"
echo "│   └── restore.sh          - Restore from backup"
echo "├── maintenance/"
echo "│   ├── cleanup.sh          - Clean up old files/logs"
echo "│   ├── update-deps.sh      - Update dependencies"
echo "│   └── optimize-db.sh      - Database optimization"
echo "├── monitoring/"
echo "│   ├── check-services.sh   - Check service status"
echo "│   ├── check-resources.sh  - Check system resources"
echo "│   └── tail-logs.sh        - View application logs"
echo "└── database/"
echo "    ├── migrate.sh          - Run database migrations"
echo "    ├── seed.sh             - Seed initial data"
echo "    └── reset.sh            - Reset database (dev only)"
echo ""

# List all shell scripts with brief analysis
echo -e "${YELLOW}Current scripts in root directory:${NC}"
echo ""

for script in *.sh; do
  if [ -f "$script" ]; then
    size=$(wc -l < "$script")
    echo "  - $script ($size lines)"
    
    # Try to detect purpose from filename
    if [[ "$script" == *"deploy"* ]]; then
      echo "      → Suggested: scripts/deploy/"
    elif [[ "$script" == *"backup"* ]]; then
      echo "      → Suggested: scripts/backup/"
    elif [[ "$script" == *"fix"* ]] || [[ "$script" == *"update"* ]]; then
      echo "      → Suggested: scripts/maintenance/"
    elif [[ "$script" == *"check"* ]] || [[ "$script" == *"monitor"* ]]; then
      echo "      → Suggested: scripts/monitoring/"
    elif [[ "$script" == *"db"* ]] || [[ "$script" == *"mongo"* ]]; then
      echo "      → Suggested: scripts/database/"
    else
      echo "      → Suggested: Review and categorize"
    fi
  fi
done

echo ""
echo -e "${GREEN}=========================================="
echo "Recommendations:"
echo "==========================================${NC}"
echo ""
echo "1. Create a unified deployment script:"
echo "   scripts/deploy/production.sh"
echo ""
echo "2. Keep ONLY these scripts in root directory:"
echo "   - start.sh (quick start)"
echo "   - stop.sh (quick stop)"
echo "   - setup.sh (initial setup)"
echo ""
echo "3. Move all other scripts to appropriate subdirectories"
echo ""
echo "4. Create a scripts/README.md documenting each script"
echo ""
echo "5. Delete obsolete/duplicate scripts"
echo ""

# Create example unified deployment script
echo -e "${YELLOW}Creating example unified deployment script...${NC}"
cat > scripts/deploy/production.sh << 'EOF'
#!/bin/bash

###############################################################################
# TRADEAI Production Deployment Script
# 
# This unified script handles production deployment with safety checks
###############################################################################

set -e

# Configuration
ENVIRONMENT="production"
APP_NAME="tradeai"
DEPLOY_USER="deploy"
LOG_FILE="/var/log/tradeai/deploy-$(date +%Y%m%d-%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
  exit 1
}

warning() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Pre-deployment checks
pre_deployment_checks() {
  log "Running pre-deployment checks..."
  
  # Check if running as correct user
  if [ "$USER" != "$DEPLOY_USER" ]; then
    warning "Not running as $DEPLOY_USER user"
  fi
  
  # Check if .env file exists
  if [ ! -f .env ]; then
    error ".env file not found"
  fi
  
  # Check disk space
  available_space=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  if [ "$available_space" -gt 90 ]; then
    error "Disk space critically low: ${available_space}% used"
  fi
  
  log "Pre-deployment checks passed ✓"
}

# Backup current version
backup_current() {
  log "Creating backup of current version..."
  
  BACKUP_DIR="/backups/tradeai/$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  
  # Backup code
  tar -czf "$BACKUP_DIR/code.tar.gz" . --exclude=node_modules --exclude=.git
  
  # Backup database
  mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/db"
  
  log "Backup created at $BACKUP_DIR ✓"
}

# Pull latest code
update_code() {
  log "Pulling latest code..."
  
  git fetch origin
  git pull origin main
  
  log "Code updated ✓"
}

# Install dependencies
install_dependencies() {
  log "Installing backend dependencies..."
  cd backend && npm ci --production
  
  log "Installing frontend dependencies..."
  cd ../frontend && npm ci --production
  cd ..
  
  log "Dependencies installed ✓"
}

# Build frontend
build_frontend() {
  log "Building frontend..."
  
  cd frontend
  npm run build
  cd ..
  
  log "Frontend built ✓"
}

# Run database migrations
run_migrations() {
  log "Running database migrations..."
  
  cd backend
  npm run migrate
  cd ..
  
  log "Migrations complete ✓"
}

# Restart services
restart_services() {
  log "Restarting services..."
  
  docker-compose -f docker-compose.production.yml down
  docker-compose -f docker-compose.production.yml up -d
  
  log "Services restarted ✓"
}

# Post-deployment health checks
health_checks() {
  log "Running health checks..."
  
  # Wait for services to start
  sleep 10
  
  # Check backend
  backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
  if [ "$backend_health" != "200" ]; then
    error "Backend health check failed (HTTP $backend_health)"
  fi
  
  # Check frontend
  frontend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
  if [ "$frontend_health" != "200" ]; then
    error "Frontend health check failed (HTTP $frontend_health)"
  fi
  
  log "Health checks passed ✓"
}

# Main deployment process
main() {
  log "=========================================="
  log "TRADEAI Production Deployment"
  log "=========================================="
  log ""
  
  pre_deployment_checks
  backup_current
  update_code
  install_dependencies
  build_frontend
  run_migrations
  restart_services
  health_checks
  
  log ""
  log "=========================================="
  log "Deployment completed successfully! 🚀"
  log "=========================================="
  log ""
  log "Deployment log: $LOG_FILE"
}

# Run main function
main
EOF

chmod +x scripts/deploy/production.sh

echo -e "${GREEN}Created: scripts/deploy/production.sh${NC}"
echo ""

# Create scripts README
cat > scripts/README.md << 'EOF'
# TRADEAI Scripts Documentation

This directory contains organized scripts for deployment, maintenance, and operations.

## Directory Structure

### deploy/
Deployment scripts for different environments

- `production.sh` - Deploy to production (with safety checks)
- `staging.sh` - Deploy to staging environment
- `development.sh` - Set up development environment
- `rollback.sh` - Rollback to previous version
- `health-check.sh` - Verify deployment health

### backup/
Backup and restore scripts

- `backup-db.sh` - Backup MongoDB database
- `backup-files.sh` - Backup application files
- `restore.sh` - Restore from backup

### maintenance/
Maintenance and cleanup scripts

- `cleanup.sh` - Clean up old logs and temporary files
- `update-deps.sh` - Update npm dependencies
- `optimize-db.sh` - Optimize database performance

### monitoring/
Monitoring and diagnostics scripts

- `check-services.sh` - Check service status
- `check-resources.sh` - Monitor system resources
- `tail-logs.sh` - View application logs

### database/
Database management scripts

- `migrate.sh` - Run database migrations
- `seed.sh` - Seed initial/test data
- `reset.sh` - Reset database (development only)

## Usage

All scripts should be run from the project root directory:

```bash
# Production deployment
./scripts/deploy/production.sh

# Backup database
./scripts/backup/backup-db.sh

# Check service status
./scripts/monitoring/check-services.sh
```

## Safety

- Production scripts include safety checks
- Backups are created before major operations
- Health checks verify successful deployment
- All actions are logged

## Adding New Scripts

When adding new scripts:
1. Place in appropriate directory
2. Add execute permissions: `chmod +x script.sh`
3. Document in this README
4. Include error handling and logging
5. Test in development first
EOF

echo -e "${GREEN}Created: scripts/README.md${NC}"
echo ""

echo -e "${GREEN}=========================================="
echo "Script consolidation structure created!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Review the suggested organization above"
echo "2. Manually move scripts to appropriate directories"
echo "3. Update any references to moved scripts"
echo "4. Test the unified deployment script"
echo "5. Delete obsolete scripts"
echo ""
echo "Example commands:"
echo "  mv deploy-prod-v*.sh scripts/deploy/"
echo "  mv backup*.sh scripts/backup/"
echo "  mv check*.sh scripts/monitoring/"
echo ""
