#!/bin/bash

# TRADEAI Production Restore Script
# =================================
# This script restores TRADEAI platform data from a backup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 TRADEAI Production Restore${NC}"
echo -e "${GREEN}=============================${NC}"

# Check if backup name is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Backup name is required${NC}"
    echo -e "${BLUE}Usage: $0 <backup_name>${NC}"
    echo -e "${BLUE}Example: $0 tradeai_backup_20241201_143022${NC}"
    echo ""
    echo -e "${BLUE}Available backups:${NC}"
    ls -1 ./data/backups/tradeai_backup_*.tar.gz 2>/dev/null | sed 's/.*\///' | sed 's/.tar.gz$//' || echo "No backups found"
    exit 1
fi

BACKUP_NAME="$1"
BACKUP_DIR="./data/backups"
BACKUP_FILE="$BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
    echo -e "${BLUE}Available backups:${NC}"
    ls -1 $BACKUP_DIR/tradeai_backup_*.tar.gz 2>/dev/null | sed 's/.*\///' | sed 's/.tar.gz$//' || echo "No backups found"
    exit 1
fi

echo -e "${BLUE}📦 Restoring from backup: $BACKUP_NAME${NC}"

# Confirmation prompt
echo -e "${YELLOW}⚠️  WARNING: This will overwrite all current data!${NC}"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Restore cancelled${NC}"
    exit 1
fi

# Stop services
echo -e "${YELLOW}🛑 Stopping services...${NC}"
docker-compose -f docker-compose.production.yml down

# Extract backup
echo -e "${BLUE}📂 Extracting backup...${NC}"
cd $BACKUP_DIR
tar -xzf "$BACKUP_NAME.tar.gz"
cd ../..

RESTORE_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Restore database
echo -e "${YELLOW}🗄️  Restoring PostgreSQL database...${NC}"
docker-compose -f docker-compose.production.yml up -d postgres
sleep 10

# Wait for database to be ready
echo -e "${BLUE}⏳ Waiting for database to be ready...${NC}"
until docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U tradeai_user; do
    sleep 2
done

# Drop and recreate database
docker-compose -f docker-compose.production.yml exec -T postgres psql -U tradeai_user -c "DROP DATABASE IF EXISTS tradeai_db;"
docker-compose -f docker-compose.production.yml exec -T postgres psql -U tradeai_user -c "CREATE DATABASE tradeai_db;"

# Restore database dump
docker-compose -f docker-compose.production.yml exec -T postgres psql -U tradeai_user tradeai_db < "$RESTORE_PATH/database.sql"

# Restore Redis data
echo -e "${YELLOW}💾 Restoring Redis data...${NC}"
docker-compose -f docker-compose.production.yml up -d redis
sleep 5

# Copy Redis dump file
if [ -f "$RESTORE_PATH/redis_dump.rdb" ]; then
    docker cp "$RESTORE_PATH/redis_dump.rdb" $(docker-compose -f docker-compose.production.yml ps -q redis):/data/dump.rdb
    docker-compose -f docker-compose.production.yml restart redis
fi

# Restore uploaded files
echo -e "${YELLOW}📁 Restoring uploaded files...${NC}"
if [ -d "$RESTORE_PATH/uploads" ]; then
    rm -rf ./data/uploads
    cp -r "$RESTORE_PATH/uploads" ./data/
    chown -R 1000:1000 ./data/uploads
fi

# Restore environment files (optional - with confirmation)
echo -e "${YELLOW}⚙️  Restore configuration files?${NC}"
read -p "Do you want to restore environment files? This will overwrite current settings (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp "$RESTORE_PATH/.env" ./ 2>/dev/null || echo "No main .env file in backup"
    cp "$RESTORE_PATH/frontend.env" frontend/.env 2>/dev/null || echo "No frontend .env file in backup"
    cp "$RESTORE_PATH/backend.env" backend/.env 2>/dev/null || echo "No backend .env file in backup"
    echo -e "${GREEN}✅ Configuration files restored${NC}"
else
    echo -e "${BLUE}ℹ️  Configuration files not restored${NC}"
fi

# Start all services
echo -e "${BLUE}🚀 Starting all services...${NC}"
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Check service health
echo -e "${BLUE}🏥 Checking service health...${NC}"
docker-compose -f docker-compose.production.yml ps

# Clean up extracted backup
rm -rf "$RESTORE_PATH"

# Display restore information
echo ""
echo -e "${GREEN}🎉 Restore completed successfully!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${BLUE}📊 Restored from backup:${NC}"
echo -e "   Name: $BACKUP_NAME"
echo -e "   Date: $(date)"
echo ""
echo -e "${BLUE}🌐 Service URLs:${NC}"
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo -e "   Frontend: http://$SERVER_IP:3000"
echo -e "   Backend API: http://$SERVER_IP:5000"
echo -e "   Admin Panel: http://$SERVER_IP:3000/admin"
echo ""
echo -e "${BLUE}🔐 Default Admin Credentials:${NC}"
echo -e "   Email: admin@gonxt.com"
echo -e "   Password: Admin123!"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo -e "   1. Verify all services are running correctly"
echo -e "   2. Test login functionality"
echo -e "   3. Check data integrity"
echo -e "   4. Update passwords if needed"
echo ""
echo -e "${GREEN}✅ TRADEAI platform restored and running!${NC}"