#!/bin/bash

# TRADEAI Production Backup Script
# ================================
# This script creates backups of the TRADEAI platform data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 TRADEAI Production Backup${NC}"
echo -e "${GREEN}============================${NC}"

# Configuration
BACKUP_DIR="./data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="tradeai_backup_$TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo -e "${BLUE}📦 Creating backup: $BACKUP_NAME${NC}"

# Create backup directory
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
mkdir -p $BACKUP_PATH

# Backup database
echo -e "${YELLOW}🗄️  Backing up PostgreSQL database...${NC}"
docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U tradeai_user tradeai_db > "$BACKUP_PATH/database.sql"

# Backup Redis data
echo -e "${YELLOW}💾 Backing up Redis data...${NC}"
docker-compose -f docker-compose.production.yml exec -T redis redis-cli --rdb /data/dump.rdb
docker cp $(docker-compose -f docker-compose.production.yml ps -q redis):/data/dump.rdb "$BACKUP_PATH/redis_dump.rdb"

# Backup uploaded files
echo -e "${YELLOW}📁 Backing up uploaded files...${NC}"
if [ -d "./data/uploads" ]; then
    cp -r ./data/uploads "$BACKUP_PATH/"
fi

# Backup environment files
echo -e "${YELLOW}⚙️  Backing up configuration files...${NC}"
cp .env "$BACKUP_PATH/" 2>/dev/null || echo "No .env file found"
cp frontend/.env "$BACKUP_PATH/frontend.env" 2>/dev/null || echo "No frontend .env file found"
cp backend/.env "$BACKUP_PATH/backend.env" 2>/dev/null || echo "No backend .env file found"

# Create backup info file
cat > "$BACKUP_PATH/backup_info.txt" << EOF
TRADEAI Backup Information
=========================
Backup Date: $(date)
Backup Name: $BACKUP_NAME
Platform Version: $(git describe --tags --always 2>/dev/null || echo "unknown")
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "unknown")

Contents:
- database.sql: PostgreSQL database dump
- redis_dump.rdb: Redis data dump
- uploads/: User uploaded files
- *.env: Environment configuration files

Restore Instructions:
1. Stop all services: docker-compose -f docker-compose.production.yml down
2. Run restore script: ./production/restore.sh $BACKUP_NAME
3. Start services: docker-compose -f docker-compose.production.yml up -d
EOF

# Compress backup
echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
cd $BACKUP_DIR
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"
cd ..

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)

echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${BLUE}📊 Backup Details:${NC}"
echo -e "   Name: $BACKUP_NAME.tar.gz"
echo -e "   Size: $BACKUP_SIZE"
echo -e "   Location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Clean up old backups (keep last 7 days)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
find $BACKUP_DIR -name "tradeai_backup_*.tar.gz" -mtime +7 -delete
REMAINING_BACKUPS=$(ls -1 $BACKUP_DIR/tradeai_backup_*.tar.gz 2>/dev/null | wc -l)
echo -e "${BLUE}📈 Remaining backups: $REMAINING_BACKUPS${NC}"

echo -e "${GREEN}🎉 Backup process completed!${NC}"