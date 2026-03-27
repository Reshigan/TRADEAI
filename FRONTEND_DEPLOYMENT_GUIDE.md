# TRADEAI Frontend Deployment Guide

## Problem: Old UI Still Showing

The production frontend is currently running **Build ID: 2025-11-19T06:09Z** (from November 2025), which is outdated. The codebase has many new components and features that haven't been deployed.

## Current Status

### Deployed Version (OLD)
- **Build ID**: 2025-11-19T06:09Z
- **Bundle**: main.29a748ba.js
- **Deployed**: November 2025
- **Status**: ❌ OUTDATED

### Available in Codebase (NEW)
- **Package Version**: 2.1.3
- **Components**: 49+ component directories
- **Features**: AI Assistant, Command Center, Advanced Analytics, etc.
- **Status**: ✅ READY TO DEPLOY

## New UI Components Ready for Deployment

### AI & Intelligence
- ✅ AIAssistant - AI-powered chat and assistance
- ✅ CommandCenter - Central command interface
- ✅ ai-insights - AI-generated insights
- ✅ ai-widgets - Interactive AI widgets
- ✅ contextual-ai - Context-aware AI features
- ✅ copilot - AI copilot functionality

### Analytics & Reporting
- ✅ AnalyticsDashboard - Advanced analytics
- ✅ analytics - Comprehensive analytics suite
- ✅ reports - Enhanced reporting components
- ✅ realtime - Real-time data visualization

### Core Features
- ✅ budgets - Budget management UI
- ✅ promotions - Promotion planning and execution
- ✅ tradeSpends - Trade spend management
- ✅ customers - Customer management (enhanced)
- ✅ products - Product management (enhanced)
- ✅ hierarchy - Organizational hierarchy
- ✅ activityGrid - Activity grid views

### Enterprise Features
- ✅ enterprise - Enterprise-grade components
- ✅ admin - Admin panel components
- ✅ superadmin - Super admin features
- ✅ companies - Company management
- ✅ users - User management
- ✅ security - Security settings

### Advanced Features
- ✅ forecasting - Predictive forecasting
- ✅ ml - Machine learning interfaces
- ✅ monitoring - System monitoring
- ✅ workflow - Workflow automation
- ✅ flows - Process flows
- ✅ integrations - Third-party integrations
- ✅ Wizards - Setup and configuration wizards

## Deployment Options

### Option 1: Automated Script (Recommended)

```bash
cd /workspace/project/TRADEAI
./scripts/deploy-frontend.sh
```

This script will:
1. Install dependencies
2. Build the frontend
3. Deploy to Cloudflare Pages
4. Verify deployment

### Option 2: Manual Deployment

```bash
# Navigate to frontend directory
cd /workspace/project/TRADEAI/frontend

# Install dependencies
npm install --legacy-peer-deps

# Set environment variables
export REACT_APP_API_URL=https://tradeai-api.reshigan-085.workers.dev/api
export REACT_APP_API_BASE_URL=https://tradeai-api.reshigan-085.workers.dev/api
export REACT_APP_ML_API_URL=https://tradeai-api.reshigan-085.workers.dev/api/ml

# Build for production
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy build --project-name=tradeai
```

### Option 3: GitHub Actions (CI/CD)

Push to main branch to trigger automatic deployment:

```bash
git add .
git commit -m "Deploy latest UI changes"
git push origin main
```

This will trigger the `cloudflare-deploy.yml` workflow which:
1. Runs linting
2. Builds the frontend
3. Deploys to Cloudflare Pages automatically

## Required Credentials

### For Manual Deployment
You need Cloudflare credentials set as environment variables:

```bash
export CLOUDFLARE_API_KEY="your-api-key"
export CLOUDFLARE_EMAIL="your-email@example.com"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
```

Or authenticate interactively:
```bash
wrangler login
```

### For GitHub Actions
Configure these secrets in your GitHub repository:
- `CLOUDFLARE_API_KEY`
- `CLOUDFLARE_EMAIL`
- `CLOUDFLARE_ACCOUNT_ID`

## Post-Deployment Steps

### 1. Clear Browser Cache
The old version may be cached. Users need to:
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely
- Or open in incognito/private mode

### 2. Verify Deployment
```bash
# Check health endpoint
curl https://tradeai.vantax.co.za/health.json

# Check new bundle is loaded
curl https://tradeai.vantax.co.za/ | grep "main\."
```

### 3. Test New Features
- Navigate to `/dashboard` - Check for new AI widgets
- Navigate to `/analytics` - Verify new analytics dashboard
- Check for AI Assistant in the UI
- Test Command Center functionality

## Troubleshooting

### Issue: Build Fails
**Solution**: Check Node.js version (should be 18+)
```bash
node -v
npm install --legacy-peer-deps
```

### Issue: Deployment Fails
**Solution**: Verify Cloudflare authentication
```bash
wrangler whoami
wrangler login
```

### Issue: Old UI Still Shows After Deployment
**Solution**: 
1. Clear browser cache completely
2. Check Cloudflare Pages deployment history
3. Verify the correct project is being deployed to
4. Check if CDN cache needs to be purged

### Issue: API Errors After Deployment
**Solution**: Verify API URLs are correct
```bash
# Check environment variables
echo $REACT_APP_API_URL
echo $REACT_APP_API_BASE_URL
```

## Deployment Verification Checklist

- [ ] Frontend build completes without errors
- [ ] New bundle hash is different from old (not main.29a748ba.js)
- [ ] Deployment to Cloudflare Pages succeeds
- [ ] Health check returns HTTP 200
- [ ] New UI components visible after cache clear
- [ ] API integration working correctly
- [ ] All routes accessible
- [ ] No console errors in browser

## Monitoring

After deployment, monitor:
1. Cloudflare Pages deployment logs
2. Cloudflare Workers analytics
3. User feedback on new UI
4. Error rates in Cloudflare dashboard
5. Performance metrics

## Rollback Procedure

If issues occur, rollback to previous deployment:

```bash
# List previous deployments
wrangler pages deployment list --project-name=tradeai

# Rollback to specific deployment
wrangler pages deployment rollback <DEPLOYMENT_ID> --project-name=tradeai
```

## Support

For issues during deployment:
1. Check Cloudflare Pages dashboard: https://dash.cloudflare.com/
2. Review deployment logs in GitHub Actions
3. Check frontend build logs
4. Verify environment variables are correct

---

**Last Updated**: March 27, 2026
**Status**: Ready for Deployment
