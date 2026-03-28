# CI/CD Workflow Setup Instructions

## 🚨 IMPORTANT: GitHub Actions Workflow Deployment

The workflow file `.github/workflows/deploy.yml` requires special permissions to be pushed to the repository.

---

## Option 1: Manual Upload (Recommended)

### Steps:

1. **Download the workflow file** from the repository:
   ```bash
   # From repository root
   cat .github/workflows/deploy.yml
   ```

2. **Create the file in GitHub UI**:
   - Go to: https://github.com/Reshigan/TRADEAI
   - Navigate to: `.github/workflows/`
   - Click "Add file" → "Create new file"
   - Name: `deploy.yml`
   - Paste the contents of `.github/workflows/deploy.yml`
   - Commit directly to `main` branch

3. **Verify workflow is active**:
   - Go to: https://github.com/Reshigan/TRADEAI/actions
   - You should see "Cloudflare Deployment" workflow
   - It will trigger on next push to main

---

## Option 2: Update Personal Access Token

If you want to push the workflow file via git:

### Steps:

1. **Create new token with workflow scope**:
   - Go to: https://github.com/settings/tokens
   - Create new token (classic)
   - Select scopes:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows) ⚠️ **REQUIRED**
   - Generate token

2. **Update remote URL with new token**:
   ```bash
   git remote set-url origin https://YOUR_USERNAME:NEW_TOKEN@github.com/Reshigan/TRADEAI.git
   ```

3. **Push the workflow file**:
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "ci: Add Cloudflare deployment workflow"
   git push origin main
   ```

---

## Option 3: Use GitHub CLI

If you have `gh` installed:

```bash
# Add the workflow file
git add .github/workflows/deploy.yml
git commit -m "ci: Add Cloudflare deployment workflow"

# Push using gh (handles auth automatically)
gh repo push origin main
```

---

## Verify Workflow Setup

After uploading the workflow file:

1. **Check workflow is visible**:
   - Visit: https://github.com/Reshigan/TRADEAI/actions
   - Should see "Cloudflare Deployment" workflow

2. **Test workflow manually**:
   - Click on "Cloudflare Deployment" workflow
   - Click "Run workflow" button
   - Select branch: `main`
   - Click "Run workflow"

3. **Monitor execution**:
   - Watch the workflow run in real-time
   - Check each job completes successfully
   - Verify deployment URLs are accessible

---

## Required Secrets

Before the workflow can deploy, set these secrets in GitHub:

### Repository Secrets

Go to: https://github.com/Reshigan/TRADEAI/settings/secrets/actions

**Required Secrets**:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | Cloudflare Dashboard → Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Cloudflare Dashboard (right sidebar) |

### Repository Variables (Optional)

Go to: https://github.com/Reshigan/TRADEAI/settings/variables/actions

**Optional Variables**:

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | https://tradeai-api.vantax.workers.dev |
| `REACT_APP_WS_URL` | WebSocket URL | wss://tradeai-api.vantax.workers.dev/ws |

---

## Workflow Features

### Automated Triggers

- **Push to main**: Auto-deploy backend and frontend
- **Pull Request**: Run tests only
- **Manual Trigger**: Deploy on-demand via GitHub UI

### Jobs

1. **Test**: Run linting, tests, build
2. **Deploy Backend**: Migrate DB, deploy Workers
3. **Deploy Frontend**: Build and deploy to Pages
4. **Verify**: Smoke tests on deployed services
5. **Notify**: Send Slack notification (if configured)

### Deployment URLs

After successful deployment:

- **Backend**: https://tradeai-api.vantax.workers.dev
- **Frontend**: https://tradeai.vantax.co.za

---

## Troubleshooting

### Workflow Not Triggering

**Check**:
- Workflow file is in `.github/workflows/` directory
- File is named `deploy.yml` (not `deploy.yaml`)
- YAML syntax is valid
- Branch name matches trigger (`main`)

### Deployment Fails

**Check**:
- Secrets are configured correctly
- Cloudflare API token has correct permissions
- D1 database exists and is accessible
- Worker and Pages projects exist

### Permission Errors

**Solution**:
- Ensure API token has `workflow` scope
- Or manually upload workflow file via GitHub UI

---

## Next Steps

1. ✅ Upload workflow file (via UI or git with proper token)
2. ✅ Configure repository secrets
3. ✅ Test workflow with manual trigger
4. ✅ Monitor first automated deployment
5. ✅ Set up Slack notifications (optional)

---

## Support

If you encounter issues:

1. Check GitHub Actions logs
2. Review Cloudflare deployment logs
3. Verify credentials and permissions
4. Contact DevOps team

---

**Status**: Ready for deployment
**Last Updated**: Current
**Version**: 1.0.0
