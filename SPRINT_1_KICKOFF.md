# 🚀 Sprint 1 Kickoff: Monitoring & Observability
## Week 1 of Option C Enterprise-Ready Launch Plan

**Sprint Duration:** Week 1 (5 days)  
**Sprint Goal:** Make the system observable, monitored, and production-safe  
**Status:** ✅ READY TO START

---

## 📋 Sprint Overview

### What We're Building This Week

1. **APM & Performance Monitoring** ⭐⭐⭐⭐⭐
   - Install monitoring agent (New Relic/DataDog/Elastic APM)
   - Track API response times, error rates, database performance
   - Frontend performance monitoring (Core Web Vitals)
   - Create monitoring dashboards

2. **Structured Logging Enhancement** ⭐⭐⭐⭐⭐
   - ✅ Winston logger already exists!
   - Add correlation ID middleware (✅ CREATED)
   - Daily log rotation (needs Winston daily-rotate-file)
   - Log aggregation setup

3. **Enhanced Health Checks** ⭐⭐⭐⭐
   - ✅ Already comprehensive!
   - Component-level checks (DB, Redis, AI service)
   - Kubernetes probes (liveness, readiness, startup)
   - Prometheus metrics endpoint

4. **Automated Backups** ⭐⭐⭐⭐⭐
   - ✅ Backup script already exists!
   - Set up cron job for daily backups
   - Test restore procedure
   - Document disaster recovery plan

5. **Alerting System** ⭐⭐⭐⭐⭐
   - Configure alert rules
   - Set up Slack/email notifications
   - Create incident response runbook

---

## ✅ What's Already Done

### Excellent News! 🎉

1. **Winston Logger** ✅
   - Location: `/backend/src/utils/logger.js`
   - Features:
     - ✅ Structured JSON logging
     - ✅ Multiple log levels (error, warn, info)
     - ✅ File transports (error.log, combined.log)
     - ✅ Helper functions (logRequest, logError, logAudit)
   - **What's needed:** Daily rotation + correlation IDs

2. **Comprehensive Health Checks** ✅
   - Location: `/backend/src/routes/health.js`
   - Features:
     - ✅ Basic health check `/health`
     - ✅ Detailed health check `/health/detailed`
     - ✅ Kubernetes probes (liveness, readiness, startup)
     - ✅ Prometheus metrics endpoint `/metrics`
     - ✅ MongoDB, Redis, Memory, CPU checks
   - **Status:** PRODUCTION READY!

3. **Backup Script** ✅
   - Location: `/scripts/backup-mongodb.sh`
   - Features:
     - ✅ MongoDB dump with compression
     - ✅ S3 upload support
     - ✅ Retention policy
     - ✅ Verification
   - **What's needed:** Set up cron job

4. **Correlation ID Middleware** ✅
   - Location: `/backend/src/middleware/correlationId.js`
   - Features:
     - ✅ UUID generation for each request
     - ✅ Request/response logging
     - ✅ Duration tracking
   - **Status:** READY TO INTEGRATE

---

## 📝 Tasks for Week 1

### Day 1: Monitoring Setup (Monday)

#### Task 1.1: Choose APM Tool
**Decision needed:** Which monitoring tool?

**Option A: New Relic (Recommended for startups)**
```bash
npm install newrelic --save
```
- ✅ Free tier: 100GB/month
- ✅ Easy setup (5 minutes)
- ✅ Great UI/UX
- ✅ AI-powered insights

**Option B: Elastic APM (Recommended for self-hosted)**
```bash
npm install elastic-apm-node --save
```
- ✅ Open source
- ✅ Self-hosted option
- ✅ Integrates with ELK stack
- ✅ No data limits

**Option C: DataDog (Recommended for enterprises)**
```bash
npm install dd-trace --save
```
- ✅ Most comprehensive features
- ✅ Infrastructure + APM
- ❌ More expensive

**My Recommendation:** Start with **New Relic** (easiest, great free tier)

#### Task 1.2: Install & Configure New Relic
```bash
# On the server
cd ~/TRADEAI-latest/backend
npm install newrelic --save

# Create newrelic.js configuration
# (I'll provide the config file)
```

#### Task 1.3: Configure Frontend Monitoring
```bash
# Install Google Analytics 4 + Web Vitals
cd ~/TRADEAI-latest/frontend
npm install web-vitals --save
```

---

### Day 2: Logging Enhancement (Tuesday)

#### Task 2.1: Integrate Correlation ID Middleware
```javascript
// backend/server-production.js (or main server file)
const correlationIdMiddleware = require('./src/middleware/correlationId');

// Add early in middleware chain (after body-parser, before routes)
app.use(correlationIdMiddleware);
```

#### Task 2.2: Enhance Winston with Daily Rotation
```bash
# Already installed on server! ✅
# Just need to update logger.js to use it
```

Update `/backend/src/utils/logger.js`:
```javascript
const DailyRotateFile = require('winston-daily-rotate-file');

// Replace File transports with DailyRotateFile transports
new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error'
})
```

#### Task 2.3: Test Logging
```bash
# SSH to server
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143

# Check logs directory
cd ~/TRADEAI-latest/backend
ls -lh logs/

# Tail logs in real-time
tail -f logs/combined-*.log | jq '.'
```

---

### Day 3: Backup Automation (Wednesday)

#### Task 3.1: Test Backup Script
```bash
# SSH to server
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143

# Make script executable
chmod +x ~/TRADEAI-latest/scripts/backup-mongodb.sh

# Test backup (dry run)
~/TRADEAI-latest/scripts/backup-mongodb.sh

# Verify backup was created
ls -lh /var/backups/mongodb/
```

#### Task 3.2: Set Up Cron Job
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/ubuntu/TRADEAI-latest/scripts/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1

# Add weekly backup verification (optional)
0 3 * * 0 /home/ubuntu/TRADEAI-latest/scripts/verify-backup.sh >> /var/log/backup-verify.log 2>&1
```

#### Task 3.3: Document Restore Procedure
Create `/scripts/restore-mongodb.md` with step-by-step restore instructions.

#### Task 3.4: Test Restore (IMPORTANT!)
```bash
# Restore to a different database to test
mongorestore \
  --uri="mongodb://localhost:27017/tradeai_restore_test" \
  --gzip \
  --archive=/var/backups/mongodb/tradeai_backup_20251110_020000.tar.gz

# Verify data
mongo tradeai_restore_test
> db.users.countDocuments()
> db.customers.countDocuments()
```

---

### Day 4: Alerting Setup (Thursday)

#### Task 4.1: Create Slack Webhook (Optional but Recommended)
1. Go to https://api.slack.com/apps
2. Create new app → From scratch
3. Enable Incoming Webhooks
4. Add webhook to channel (e.g., #tradeai-alerts)
5. Copy webhook URL

#### Task 4.2: Configure Alert Rules in New Relic
```
Alert Policy: TradeAI Production Critical

Conditions:
1. High Error Rate
   - NRQL: SELECT percentage(count(*), WHERE error is true) FROM Transaction
   - Threshold: > 5% for at least 5 minutes
   - Critical: true

2. Slow API Response
   - NRQL: SELECT percentile(duration, 95) FROM Transaction
   - Threshold: > 2 seconds for at least 10 minutes
   - Warning: true

3. High Memory Usage
   - NRQL: SELECT average(memoryUsagePercent) FROM SystemSample
   - Threshold: > 90% for at least 5 minutes
   - Critical: true

4. Database Connection Issues
   - NRQL: SELECT count(*) FROM Transaction WHERE databaseDuration IS NULL
   - Threshold: > 10 transactions for at least 5 minutes
   - Critical: true
```

#### Task 4.3: Set Up Notification Channels
1. **Slack:** Connect webhook from Task 4.1
2. **Email:** Add team emails
3. **PagerDuty:** (Optional) For 24/7 on-call

#### Task 4.4: Create Incident Response Runbook
Create `/docs/runbooks/` directory with playbooks:
- `high-error-rate.md`
- `slow-api-response.md`
- `high-memory-usage.md`
- `database-issues.md`
- `backup-failure.md`

---

### Day 5: Testing & Documentation (Friday)

#### Task 5.1: End-to-End Testing
1. ✅ Trigger an error → Verify it shows in New Relic
2. ✅ Make 1000 API requests → Check response time metrics
3. ✅ Simulate high load → Verify alerts fire
4. ✅ Check logs are being written with correlation IDs
5. ✅ Verify backup ran successfully (check cron logs)
6. ✅ Test Slack alerts

#### Task 5.2: Create Monitoring Dashboard
**New Relic Dashboard:**
- API Response Time (p50, p95, p99)
- Error Rate (%)
- Throughput (requests/min)
- Database Query Time
- Memory Usage
- CPU Usage
- Active Users

#### Task 5.3: Document Everything
Create `/docs/monitoring/README.md`:
```markdown
# Monitoring & Observability Guide

## APM: New Relic
- Dashboard: [link]
- Alerts: [link]
- Login: [credentials]

## Logs
- Location: /home/ubuntu/TRADEAI-latest/backend/logs/
- Rotation: Daily
- Retention: 30 days (error), 14 days (combined)

## Backups
- Schedule: Daily at 2 AM UTC
- Location: /var/backups/mongodb/
- Cloud: s3://tradeai-backups/mongodb/
- Retention: 7 days (local), 30 days (cloud)
- Restore: See /scripts/restore-mongodb.md

## Alerts
- Slack: #tradeai-alerts
- Email: team@example.com
- Runbooks: /docs/runbooks/
```

---

## 🎯 Sprint Success Criteria

### Definition of Done

Sprint 1 is complete when:

1. **Monitoring** ✅
   - [ ] New Relic APM installed and collecting data
   - [ ] Frontend performance monitoring active
   - [ ] Monitoring dashboard created
   - [ ] Team can see real-time metrics

2. **Logging** ✅
   - [ ] Correlation IDs in all log entries
   - [ ] Daily log rotation working
   - [ ] Logs are structured (JSON)
   - [ ] Team can search/filter logs

3. **Backups** ✅
   - [ ] Automated daily backups running
   - [ ] Backup verification passing
   - [ ] Restore procedure documented and tested
   - [ ] Cloud storage configured (S3)

4. **Alerting** ✅
   - [ ] 4+ alert rules configured
   - [ ] Slack notifications working
   - [ ] Email notifications working
   - [ ] Runbooks created for each alert type

5. **Documentation** ✅
   - [ ] Monitoring guide written
   - [ ] Runbooks created
   - [ ] Team trained on tools

---

## 📊 Expected Outcomes

After Sprint 1, you'll be able to:

1. **See what's happening**
   - Real-time API performance metrics
   - Error tracking with stack traces
   - Database query performance
   - User activity patterns

2. **Get notified when things break**
   - Slack alerts for critical issues
   - Email for warnings
   - Know about problems before users report them

3. **Debug production issues**
   - Correlation IDs to trace requests
   - Structured logs for searching
   - Performance bottleneck identification

4. **Recover from disasters**
   - Daily automated backups
   - Tested restore procedure
   - 30-day backup retention

5. **Sleep better at night** 😴
   - Confidence that system is monitored
   - Know you can restore data if needed
   - Alerts will wake you if something breaks

---

## 🚀 Let's Start!

### Immediate Next Steps (Right Now)

1. **Choose APM tool** → Recommend: New Relic
2. **Sign up for free account** → newrelic.com
3. **Get license key** → Copy for installation
4. **SSH to server** → Begin installation

### Monday Morning Checklist

```bash
# 1. SSH to server
ssh -i "VantaX-2.pem" ubuntu@3.10.212.143

# 2. Navigate to project
cd ~/TRADEAI-latest/backend

# 3. Install New Relic
npm install newrelic --save

# 4. Create configuration
nano newrelic.js
# (Paste configuration - I'll provide)

# 5. Update server startup
nano server-production.js
# Add: require('newrelic') at the very top

# 6. Restart backend
pm2 restart tradeai-backend

# 7. Verify New Relic is collecting data
# Check New Relic dashboard (wait 2-3 minutes)
```

---

## 📞 Questions?

Common questions:

**Q: Which APM tool should I use?**  
A: New Relic for easiest setup. Elastic APM if you want self-hosted.

**Q: How much will New Relic cost?**  
A: Free tier is generous (100GB/month). Should be fine for months.

**Q: Do I need to back up to S3?**  
A: Highly recommended! Local backups can be lost if server fails.

**Q: What if an alert fires at 3 AM?**  
A: That's why we create runbooks! Follow the playbook to fix it.

**Q: Can we skip the backup testing?**  
A: NO! Backups without restore testing are just expensive deletes.

---

## 🎉 Ready to Start?

**Sprint 1 Goal:** Production-grade observability

**Your system is already 85% there.** This week, we make it **production-safe** with monitoring, logging, backups, and alerting.

**After this sprint:**
- ✅ No more flying blind
- ✅ Know when things break
- ✅ Can recover from disasters
- ✅ Professional operational maturity

Let's build enterprise-grade reliability! 🚀

---

**Next:** Sprint 2 will focus on data import/export and UX polish.

**Questions?** Just ask!

