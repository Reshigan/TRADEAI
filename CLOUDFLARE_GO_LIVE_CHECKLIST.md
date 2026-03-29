# 🚀 TRADEAI Cloudflare Production Go-Live Checklist

**Status:** Ready for Production Deployment  
**Date:** March 29, 2026  
**Domain:** tradeai.vantax.co.za (primary), tradeai.gonxt.tech (legacy)  
**Backend:** Cloudflare Workers (tradeai-api)  
**Frontend:** Cloudflare Pages  

---

## ✅ TASK 1: Cloudflare DNS & SSL/TLS Configuration

### Current Status
- ✅ DNS managed by Cloudflare
- ✅ Workers deployed: `tradeai-api`
- ✅ Pages deployed: `tradeai`
- ⚠️ SSL/TLS mode needs verification

### Required Cloudflare Dashboard Settings

#### 1.1 SSL/TLS Configuration
**Navigate to:** SSL/TLS → Overview

**Settings:**
- **Encryption Mode:** `Full (Strict)` ⚠️ CRITICAL
  - Prevents SSL loops
  - Requires valid certificate on origin (Cloudflare Workers have this by default)
  
- **Always Use HTTPS:** `ON`
  - Navigate to: SSL/TLS → Edge Certificates → Always Use HTTPS
  
- **Minimum TLS Version:** `TLS 1.2`
  - Navigate to: SSL/TLS → Edge Certificates → Minimum TLS Version
  
- **Opportunistic Encryption:** `ON`
- **TLS 1.3:** `Enabled`
- **Certificate Transparency Monitoring:** `ON`

#### 1.2 DNS Records Verification
**Navigate to:** DNS → DNS

**Required Records:**
```
Type    Name                    Content                        TTL     Proxy
----    ----                    -------                        ---     -----
CNAME   tradeai.vantax.co.za    tradeai.pages.dev              Auto    ✅ Proxied
CNAME   www.tradeai.vantax.co.za tradeai.pages.dev             Auto    ✅ Proxied
CNAME   tradeai-api             tradeai-api.reshigan-085.workers.dev  Auto  ✅ Proxied
```

**Action Items:**
- [ ] Verify all DNS records exist
- [ ] Ensure all records are proxied (orange cloud ON)
- [ ] Remove any A records pointing to old infrastructure
- [ ] Verify DNS propagation: `dig tradeai.vantax.co.za`

#### 1.3 Prevent Redirect Loops
**Issue:** Common cause is double HTTPS redirection

**Solution:**
1. In Cloudflare Dashboard: SSL/TLS → Edge Certificates → **Always Use HTTPS** = ON
2. In Workers code: Ensure no manual HTTP→HTTPS redirects (already correct in current code)
3. In Pages: No custom redirect rules needed (handled automatically)

**Verification:**
```bash
# Test for redirect loops
curl -I http://tradeai.vantax.co.za
# Should return: HTTP/2 301 → https://tradeai.vantax.co.za

curl -I https://tradeai.vantax.co.za
# Should return: HTTP/2 200 (no further redirects)
```

---

## ✅ TASK 2: WAF & Security Configuration

### 2.1 Bot Fight Mode
**Navigate to:** Security → Bots

**Settings:**
- **Bot Fight Mode:** `ON` ✅
  - Free tier: Automatically detects and mitigates automated threats
  - Blocks malicious bots while allowing good bots (Google, Bing, etc.)

### 2.2 WAF Security Rules
**Navigate to:** Security → WAF → Managed Rules

**Enable These Managed Rules:**
- [ ] **Cloudflare Specials** - Critical security rules
- [ ] **OWASP ModSecurity Core Rule Set** - Web application firewall
- [ ] **Bad Reputation IPs** - Block known malicious IPs

**Custom WAF Rules (Security → WAF → Custom Rules):**

#### Rule 1: Block Common Attacks
```
Name: Block Common Exploits
Field: URI Path
Operator: contains
Value: /wp-admin OR /phpmyadmin OR /.env OR /config.php OR /xmlrpc.php
Action: Block
```

#### Rule 2: Rate Limiting for API
**Navigate to:** Security → WAF → Rate limiting rules

```
Name: API Rate Limiting
Request URL: Contains /api/
Rate: 100 requests per 60 seconds
Action: Block
Expression: (ip.geoip.country eq "unknown")
```

#### Rule 3: Challenge Suspicious Traffic
```
Name: Challenge Suspicious Requests
Field: Threat Score
Operator: is greater than or equal to
Value: 14
Action: Managed Challenge
```

### 2.3 DDoS Protection
**Navigate to:** Security → Settings

**Settings:**
- **DDoS Protection:** `Standard` (free tier) or `Advanced` (paid)
- **Under Attack Mode:** Keep OFF (enable only during active attacks)

### 2.4 Security Headers
**Status:** ✅ Enhanced security headers added to Workers

Updated in `workers-backend/src/index.js`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: geolocation=(), microphone=(), camera=()
- Content-Security-Policy: Restrictive CSP for API

---

## ✅ TASK 3: Cloudflare Workers Optimization

### 3.1 Current Status
- ✅ Using Hono framework (lightweight, fast)
- ✅ D1 database configured
- ✅ R2 storage configured
- ✅ KV cache configured
- ✅ Workers AI binding configured
- ✅ Rate limiting implemented (KV-backed)
- ✅ JWT authentication implemented

### 3.2 Optimizations Applied
1. **Enhanced Security Headers** - Added comprehensive CSP and security headers
2. **Request ID Middleware** - Already implemented for structured logging
3. **Error Handling** - Sanitized error messages (no sensitive data exposure)
4. **CORS Configuration** - Properly configured for production domains

### 3.3 Performance Optimizations
**Navigate to:** Workers → tradeai-api → Settings

**Settings:**
- [ ] **Tail Worker:** Enable for better logging (optional)
- [ ] **Logpush:** Enable to send logs to Logflare/Datadog (recommended)

### 3.4 Environment Variables
**Required Secrets (Workers → tradeai-api → Settings → Variables):**
```bash
JWT_SECRET=<generate-secure-random-string>
NODE_ENV=production
```

**Action:**
```bash
# Generate secure JWT secret
openssl rand -hex 32
# Add to Workers secrets
wrangler secret put JWT_SECRET
```

---

## ✅ TASK 4: R2/KV Storage Integration

### 4.1 Current Configuration (wrangler.toml)
```toml
# D1 database - primary data store
[[d1_databases]]
binding = "DB"
database_name = "tradeai"
database_id = "adb1f315-140f-404d-a7bb-c3cbb6f3205a"

# R2 bucket for file storage
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "tradeai-storage"

# KV namespace for caching
[[kv_namespaces]]
binding = "CACHE"
id = "898dfed622044c399facd725f8815f55"
```

### 4.2 Verification Steps
```bash
# Verify D1 database
wrangler d1 execute tradeai --command "SELECT 1"

# Verify R2 bucket
wrangler r2 bucket list

# Verify KV namespace
wrangler kv:namespace list
```

### 4.3 Best Practices
- ✅ KV used for rate limiting (persistent across cold starts)
- ✅ R2 available for file uploads
- ✅ D1 used for structured data

---

## ✅ TASK 5: Caching Strategy & Performance

### 5.1 Cloudflare Pages Cache Rules
**Navigate to:** Pages → tradeai → Settings → Functions

**Create _routes.json** in `frontend/public/_routes.json`:
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*", "/auth/*", "/dashboard/*", "/admin/*"]
}
```

### 5.2 Cache Headers Strategy

#### Static Assets (Cache Everything)
**Files:** JS, CSS, images, fonts in `/static/`
**Headers:**
```
Cache-Control: public, max-age=31536000, immutable
```

#### HTML Pages (Cache Short-Term)
**Files:** *.html
**Headers:**
```
Cache-Control: public, max-age=3600, must-revalidate
```

#### API Routes (No Cache for Authenticated)
**Routes:** /api/*
**Headers:**
```
Cache-Control: private, no-store, no-cache, must-revalidate
```

#### Public API Endpoints (Cache OK)
**Routes:** /api/health, /api/public/*
**Headers:**
```
Cache-Control: public, max-age=300
```

### 5.3 Cache Purge Workflow

#### Manual Purge (Cloudflare Dashboard)
**Navigate to:** Caching → Configuration → Purge Everything
- Use for emergency cache clears

#### API-Based Purge (Recommended for CI/CD)
```bash
# Purge specific URLs
curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/purge_cache" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://tradeai.vantax.co.za/","https://tradeai.vantax.co.za/static/js/main.js"]}'

# Purge all cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/purge_cache" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

#### Automated Purge in GitHub Actions
Add to `.github/workflows/ci-cd-frontend.yml`:
```yaml
- name: Purge Cloudflare Cache
  run: |
    curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/purge_cache" \
      -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}'
```

### 5.4 Performance Optimization Checklist
- [ ] Enable **Auto Minify** (Caching → Optimization → Auto Minify)
  - JavaScript: ON
  - CSS: ON
  - HTML: ON
  
- [ ] Enable **Brotli Compression** (automatic on Cloudflare)

- [ ] Enable **HTTP/2** (enabled by default on Cloudflare)

- [ ] Enable **Early Hints** (Speed → Optimization → Early Hints)

- [ ] Configure **Cache Levels** (Caching → Configuration)
  - Cache Level: Standard
  - Browser Cache TTL: 4 hours (minimum)

---

## ✅ TASK 6: Final Validation & Testing

### 6.1 SSL/TLS Verification
```bash
# Check SSL certificate
curl -vI https://tradeai.vantax.co.za

# Verify certificate chain
openssl s_client -connect tradeai.vantax.co.za:443 -servername tradeai.vantax.co.za

# Check for SSL vulnerabilities
# Use: https://www.ssllabs.com/ssltest/
```

### 6.2 DNS Propagation Check
```bash
# Check DNS records
dig tradeai.vantax.co.za
dig www.tradeai.vantax.co.za
dig tradeai-api.reshigan-085.workers.dev

# Verify global propagation
# Use: https://dnschecker.org/
```

### 6.3 Endpoint Health Checks
```bash
# Frontend
curl -I https://tradeai.vantax.co.za
# Expected: HTTP 200

# Backend API
curl https://tradeai-api.reshigan-085.workers.dev/api/health
# Expected: {"status":"healthy","version":"2.0.0"}

# Authentication
curl -X POST https://tradeai-api.reshigan-085.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
# Expected: JWT token or 401
```

### 6.4 Security Scan
```bash
# Check security headers
curl -I https://tradeai.vantax.co.za | grep -E "X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security|Content-Security-Policy"

# Check for information disclosure
curl https://tradeai.vantax.co.za/.env
# Expected: 404 or 403

# Test XSS protection
# Use: https://securityheaders.com/
```

### 6.5 Performance Tests
```bash
# Measure TTFB
curl -w "@curl-format.txt" -o /dev/null -s https://tradeai.vantax.co.za

# curl-format.txt content:
# time_namelookup:  %{time_namelookup}\n
# time_connect:     %{time_connect}\n
# time_appconnect:  %{time_appconnect}\n
# time_pretransfer: %{time_pretransfer}\n
# time_starttransfer: %{time_starttransfer}\n
# ----------\n
# time_total:       %{time_total}\n

# Run Lighthouse audit
# Use: Chrome DevTools → Lighthouse
```

### 6.6 Load Testing
```bash
# Install k6
# Run: npm install -g k6

# Simple load test
k6 run - <<EOF
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50,
  duration: '30s',
};

export default function() {
  let res = http.get('https://tradeai.vantax.co.za');
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
EOF
```

---

## 🎯 Go-Live Deployment Steps

### Pre-Deployment (1 hour before)
1. [ ] Team notification sent
2. [ ] Monitoring dashboards ready
3. [ ] On-call engineer assigned
4. [ ] Rollback procedure reviewed

### Deployment (Zero-Downtime)
1. [ ] Deploy Workers: `cd workers-backend && wrangler deploy`
2. [ ] Deploy Pages: GitHub Actions auto-deploys on push to main
3. [ ] Verify DNS propagation
4. [ ] Purge Cloudflare cache
5. [ ] Run health checks

### Post-Deployment (First 30 minutes)
1. [ ] Monitor error rates (should be < 0.5%)
2. [ ] Check response times (P95 < 200ms)
3. [ ] Verify all critical paths work
4. [ ] Monitor database connections
5. [ ] Check rate limiting is active

### First 24 Hours
1. [ ] Monitor uptime (target: 99.9%)
2. [ ] Review access logs for anomalies
3. [ ] Check WAF blocked attacks
4. [ ] Verify cache hit rates
5. [ ] Collect user feedback

---

## 🚨 Rollback Procedure

### If Critical Issues Found

#### Rollback Workers
```bash
# List previous deployments
wrangler deploy --list

# Rollback to previous version
wrangler deploy --rollback-to <DEPLOYMENT_ID>
```

#### Rollback Pages
**Navigate to:** Pages → tradeai → Deployments
- Click on previous successful deployment
- Click "Rollback to this deployment"

#### Emergency Cache Purge
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/purge_cache" \
  -H "Authorization: Bearer <API_TOKEN>" \
  --data '{"purge_everything":true}'
```

---

## 📊 Success Metrics

### Technical KPIs (First Week)
- **Uptime:** ≥ 99.9%
- **P95 Response Time:** < 200ms
- **Error Rate:** < 0.5%
- **Cache Hit Rate:** > 80%
- **WAF Blocks:** Monitor (expected: 100-1000/day)

### Business KPIs (First Month)
- **User Adoption:** > 80% of pilot customers
- **Support Tickets:** < 20/week
- **NPS Score:** > 40
- **Page Load Time:** < 2 seconds

---

## 🔧 Troubleshooting Guide

### Issue: SSL Loop Detected
**Symptoms:** Browser shows "Too many redirects"
**Solution:**
1. Verify SSL/TLS mode is "Full (Strict)" not "Flexible"
2. Check Workers code for manual redirects
3. Clear browser cache

### Issue: API Returns 522 (Connection Timed Out)
**Symptoms:** Cloudflare error 522
**Solution:**
1. Check Workers is deployed and active
2. Verify Workers route configuration
3. Check Workers logs for errors

### Issue: Cache Not Clearing
**Symptoms:** Old content still showing after deploy
**Solution:**
1. Manually purge cache in Cloudflare dashboard
2. Check cache headers are correct
3. Verify browser cache is cleared (hard refresh)

### Issue: Rate Limiting Too Aggressive
**Symptoms:** Legitimate users getting 429 errors
**Solution:**
1. Increase rate limit in `workers-backend/src/middleware/rateLimit.js`
2. Add whitelisted IPs in Cloudflare WAF
3. Check if KV cache is working correctly

---

## 📞 Support Contacts

### Cloudflare Support
- **Dashboard:** https://dash.cloudflare.com/
- **Docs:** https://developers.cloudflare.com/
- **Status:** https://www.cloudflarestatus.com/

### Internal Team
- **On-Call:** [Insert on-call rotation]
- **Slack:** #tradeai-production
- **PagerDuty:** [Insert escalation policy]

---

**Last Updated:** March 29, 2026  
**Version:** 1.0  
**Status:** ✅ Ready for Production
