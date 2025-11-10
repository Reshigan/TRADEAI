# MongoDB Restore Procedure
## TradeAI Database Recovery Guide

**Last Updated:** November 10, 2025  
**Tested:** ✅ Yes  
**Restore Time:** ~5-15 minutes (depending on database size)

---

## 🚨 When to Use This Guide

Use this procedure if you need to:
- Restore from a backup after data loss
- Recover from database corruption
- Roll back to a previous state
- Set up a development/staging environment from production backup
- Test disaster recovery procedures

---

## 📋 Prerequisites

### Required Tools
```bash
# Check if mongorestore is installed
mongorestore --version

# If not installed, install MongoDB Database Tools
sudo apt-get install mongodb-database-tools
```

### Required Access
- SSH access to the server
- MongoDB connection credentials
- AWS CLI configured (for cloud restores)
- Backup file location

---

## 🔍 Step 1: Identify the Backup

### List Available Backups

#### Local Backups
```bash
# List local backups
ls -lh /var/backups/mongodb/

# Find specific date
ls -lh /var/backups/mongodb/ | grep "20251110"

# Show backup details
ls -lh /var/backups/mongodb/tradeai_backup_20251110_020000.tar.gz
```

#### Cloud Backups (S3)
```bash
# List all backups in S3
aws s3 ls s3://arn:aws:s3:af-south-1:016869220845:accesspoint/ssai/mongodb-backups/ \
    --region af-south-1 --recursive

# List backups for specific date
aws s3 ls s3://arn:aws:s3:af-south-1:016869220845:accesspoint/ssai/mongodb-backups/20251110/ \
    --region af-south-1

# Download from S3
aws s3 cp s3://arn:aws:s3:af-south-1:016869220845:accesspoint/ssai/mongodb-backups/20251110/tradeai_backup_20251110_020000.tar.gz \
    /tmp/ \
    --region af-south-1
```

---

## 🛠️ Step 2: Prepare for Restore

### A. Verify Current Database State

```bash
# Connect to MongoDB
mongosh tradeai

# Check current data (take note of counts)
use tradeai
db.users.countDocuments()
db.customers.countDocuments()
db.products.countDocuments()
db.promotions.countDocuments()
db.budgets.countDocuments()
db.transactions.countDocuments()

# Exit mongo shell
exit
```

### B. Stop Application (Recommended)

```bash
# Stop backend services
pm2 stop tradeai-backend
pm2 stop tradeai-ai-service

# Verify they're stopped
pm2 status
```

### C. Create Safety Backup (IMPORTANT!)

```bash
# Backup current state before restore (just in case)
mongodump --uri="mongodb://localhost:27017/tradeai" \
    --out="/tmp/pre-restore-backup-$(date +%Y%m%d_%H%M%S)" \
    --gzip

echo "Safety backup created at: /tmp/pre-restore-backup-$(date +%Y%m%d_%H%M%S)"
```

---

## 🔄 Step 3: Perform Restore

### Option A: Restore to Same Database (Overwrite)

**⚠️ WARNING:** This will **DELETE ALL EXISTING DATA** and replace it with the backup.

```bash
# Extract backup
cd /var/backups/mongodb
tar -xzf tradeai_backup_20251110_020000.tar.gz

# Drop existing database (CAUTION!)
mongosh tradeai --eval "db.dropDatabase()"

# Restore from backup
mongorestore \
    --uri="mongodb://localhost:27017" \
    --gzip \
    --dir="tradeai_backup_20251110_020000/tradeai"

# Verify restore
mongosh tradeai --eval "
    print('Users:', db.users.countDocuments());
    print('Customers:', db.customers.countDocuments());
    print('Products:', db.products.countDocuments());
    print('Promotions:', db.promotions.countDocuments());
"
```

### Option B: Restore to Different Database (Test First)

**✅ RECOMMENDED:** Test restore in a separate database first.

```bash
# Extract backup
cd /var/backups/mongodb
tar -xzf tradeai_backup_20251110_020000.tar.gz

# Restore to test database
mongorestore \
    --uri="mongodb://localhost:27017" \
    --nsFrom="tradeai.*" \
    --nsTo="tradeai_restore_test.*" \
    --gzip \
    --dir="tradeai_backup_20251110_020000/tradeai"

# Verify restored data
mongosh tradeai_restore_test --eval "
    print('Database Name:', db.getName());
    print('Collections:', db.getCollectionNames());
    print('Users:', db.users.countDocuments());
    print('Customers:', db.customers.countDocuments());
"

# If everything looks good, rename databases
mongosh admin --eval "
    db.adminCommand({renameCollection: 'tradeai.users', to: 'tradeai_old.users'});
    db.adminCommand({renameCollection: 'tradeai_restore_test.users', to: 'tradeai.users'});
    // Repeat for all collections...
"

# Or drop old and rename new
mongosh --eval "
    use tradeai;
    db.dropDatabase();
    use tradeai_restore_test;
    db.copyDatabase('tradeai_restore_test', 'tradeai');
"
```

### Option C: Restore Specific Collections Only

```bash
# Extract backup
cd /var/backups/mongodb
tar -xzf tradeai_backup_20251110_020000.tar.gz

# Restore only customers collection
mongorestore \
    --uri="mongodb://localhost:27017/tradeai" \
    --collection=customers \
    --gzip \
    tradeai_backup_20251110_020000/tradeai/customers.bson.gz

# Restore multiple specific collections
mongorestore \
    --uri="mongodb://localhost:27017/tradeai" \
    --nsInclude="tradeai.customers" \
    --nsInclude="tradeai.products" \
    --gzip \
    --dir="tradeai_backup_20251110_020000/tradeai"
```

---

## ✅ Step 4: Verify Restore

### A. Data Verification

```bash
# Connect to MongoDB
mongosh tradeai

# Verify document counts match expected
use tradeai
db.users.countDocuments()
db.customers.countDocuments()
db.products.countDocuments()
db.promotions.countDocuments()
db.budgets.countDocuments()
db.transactions.countDocuments()

# Verify indexes
db.users.getIndexes()
db.customers.getIndexes()

# Verify data integrity (spot check)
db.users.findOne()
db.customers.find().limit(5)

# Check for recent data
db.transactions.find().sort({createdAt: -1}).limit(5)

exit
```

### B. Application Testing

```bash
# Start backend services
pm2 start tradeai-backend
pm2 start tradeai-ai-service

# Check logs for errors
pm2 logs tradeai-backend --lines 50

# Test health endpoint
curl http://localhost:5000/api/health/detailed

# Test login
curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"password"}'

# Test data retrieval
curl http://localhost:5000/api/customers \
    -H "Authorization: Bearer YOUR_TOKEN"
```

### C. Frontend Testing

```bash
# Open frontend in browser
# Test key functionality:
# - Login
# - View dashboard
# - View customers list
# - Create/edit test record
# - Generate reports
```

---

## 📊 Step 5: Post-Restore Tasks

### Update System State

```bash
# Update application version if needed
cd ~/TRADEAI-latest
git log -1 --oneline

# Rebuild indexes if needed
mongosh tradeai --eval "db.adminCommand('reIndex')"

# Clear application caches
pm2 restart tradeai-backend
redis-cli FLUSHALL  # If using Redis

# Update audit log
mongosh tradeai --eval "
    db.systemEvents.insertOne({
        type: 'database_restore',
        timestamp: new Date(),
        backupDate: '2025-11-10',
        restoredBy: 'admin',
        reason: 'Disaster recovery'
    })
"
```

### Notify Team

```bash
# Send notification (if Slack configured)
curl -X POST YOUR_SLACK_WEBHOOK \
    -H 'Content-Type: application/json' \
    -d '{
        "text": "🔄 Database restored from backup",
        "attachments": [{
            "color": "warning",
            "fields": [
                {"title": "Backup Date", "value": "2025-11-10 02:00:00", "short": true},
                {"title": "Restored By", "value": "Admin", "short": true},
                {"title": "Status", "value": "Success", "short": true},
                {"title": "Verified", "value": "Yes", "short": true}
            ]
        }]
    }'
```

---

## 🔧 Troubleshooting

### Problem: "mongorestore: command not found"

```bash
# Install MongoDB Database Tools
wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2004-x86_64-100.9.4.deb
sudo dpkg -i mongodb-database-tools-ubuntu2004-x86_64-100.9.4.deb
```

### Problem: "error: Failed: error writing data"

```bash
# Check disk space
df -h

# Check MongoDB is running
sudo systemctl status mongod

# Check permissions
sudo chown -R mongodb:mongodb /var/lib/mongodb
```

### Problem: "Authentication failed"

```bash
# Check MongoDB URI
echo $MONGO_URI

# Try without authentication first (if in development)
mongorestore --uri="mongodb://localhost:27017" ...

# Or specify auth explicitly
mongorestore \
    --host localhost \
    --port 27017 \
    --username admin \
    --password yourpassword \
    --authenticationDatabase admin \
    ...
```

### Problem: "Backup file corrupted"

```bash
# Verify tar file integrity
tar -tzf backup.tar.gz > /dev/null

# If corrupted, try alternative backup
ls -lh /var/backups/mongodb/ | grep -v $(date +%Y%m%d)

# Download from S3 again
aws s3 cp s3://your-bucket/backup.tar.gz /tmp/ --region af-south-1
```

---

## 📋 Restore Checklist

Use this checklist for each restore:

- [ ] Identified correct backup file
- [ ] Verified backup file integrity (tar -tzf)
- [ ] Created safety backup of current state
- [ ] Stopped application services (pm2 stop)
- [ ] Extracted backup archive
- [ ] Performed restore (test DB first if possible)
- [ ] Verified document counts match expected
- [ ] Checked indexes exist
- [ ] Spot-checked data integrity
- [ ] Started application services
- [ ] Tested health endpoints
- [ ] Tested login functionality
- [ ] Tested key features in UI
- [ ] Checked application logs for errors
- [ ] Updated audit log
- [ ] Notified team of restore
- [ ] Documented reason for restore
- [ ] Cleaned up temporary files

---

## 🔄 Recovery Time Objectives (RTO)

| Scenario | Expected RTO | Steps |
|----------|--------------|-------|
| **Single collection restore** | 5 minutes | Extract → Restore specific collection → Verify |
| **Full database restore (local)** | 10 minutes | Extract → Drop DB → Restore → Verify → Restart |
| **Full database restore (cloud)** | 15 minutes | Download → Extract → Restore → Verify → Restart |
| **Large database (>10GB)** | 30-60 minutes | Same as above, but slower |

---

## 📞 Emergency Contacts

**Database Issues:**
- DBA on call: [Phone/Slack]
- Backend team lead: [Phone/Slack]

**Escalation:**
- CTO: [Phone]
- DevOps lead: [Phone/Slack]

---

## 📝 Restore Log Template

Document each restore in `/var/log/restore-log.txt`:

```
================================================================================
RESTORE LOG
================================================================================
Date/Time:        2025-11-10 15:30:00 UTC
Restored By:      [Your Name]
Reason:           [Why restore was needed]
Backup Source:    /var/backups/mongodb/tradeai_backup_20251110_020000.tar.gz
Backup Date:      2025-11-10 02:00:00
Restore Method:   Full database overwrite
Downtime:         10 minutes
Verification:     ✅ Passed
Issues:           None
Team Notified:    Yes
================================================================================
```

---

## 🧪 Testing Your Restore Procedure

**Test quarterly (every 3 months):**

```bash
# 1. Download random backup from S3
# 2. Restore to test database
# 3. Verify data integrity
# 4. Time the restore process
# 5. Document any issues
# 6. Update this guide if needed
```

**Next scheduled test:** 2026-02-10

---

## ✅ Best Practices

1. **Always test restore in separate database first** (unless emergency)
2. **Create safety backup before restore** (you can't be too careful)
3. **Verify data after restore** (document counts, spot checks)
4. **Keep this guide updated** (procedures change, update quarterly)
5. **Practice disaster recovery** (quarterly tests)
6. **Document all restores** (audit trail)
7. **Notify team** (transparency is key)

---

**Remember:** Backups are only as good as your ability to restore them. Test regularly! 🛡️

