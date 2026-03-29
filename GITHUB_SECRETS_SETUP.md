# Required GitHub Secrets for TRADEAI Deployment

## Cloudflare Secrets (Required)

Navigate to: GitHub Repository → Settings → Secrets and variables → Actions

### 1. CLOUDFLARE_API_TOKEN
**Purpose:** Authenticate with Cloudflare API for deployments  
**How to generate:**
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Select "Edit Cloudflare Workers" template or create custom token
4. Permissions needed:
   - **Account** → Cloudflare Pages → Edit
   - **Account** → Workers Scripts → Edit
   - **Zone** → Cache Purge → Edit
   - **Zone** → DNS → Edit (optional, for DNS management)
5. Copy the generated token
6. Add to GitHub Secrets as `CLOUDFLARE_API_TOKEN`

### 2. CLOUDFLARE_ACCOUNT_ID
**Purpose:** Identify your Cloudflare account  
**How to find:**
1. Log in to Cloudflare Dashboard
2. Look at the right side of the dashboard (Account ID)
3. Or go to https://dash.cloudflare.com/ and copy from URL
4. Add to GitHub Secrets as `CLOUDFLARE_ACCOUNT_ID`

### 3. CLOUDFLARE_ZONE_ID
**Purpose:** Identify your DNS zone for cache purging  
**How to find:**
1. Go to Cloudflare Dashboard
2. Select your domain (tradeai.vantax.co.za)
3. Look at the right side of the Overview page
4. Copy the Zone ID
5. Add to GitHub Secrets as `CLOUDFLARE_ZONE_ID`

## Workers Secrets (Required)

Navigate to: Cloudflare Dashboard → Workers & Pages → tradeai-api → Settings → Variables

### 4. JWT_SECRET
**Purpose:** Sign and verify JWT tokens for authentication  
**How to generate:**
```bash
# Generate secure random string
openssl rand -hex 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**How to set:**
```bash
# Using Wrangler CLI
wrangler secret put JWT_SECRET
# Paste the generated value when prompted
```

## Optional Secrets

### 5. CLOUDFLARE_EMAIL
**Purpose:** Alternative authentication method (if not using API token)  
**Value:** Your Cloudflare account email

### 6. CLOUDFLARE_API_KEY
**Purpose:** Global API key (less secure than API tokens, not recommended)  
**How to find:** https://dash.cloudflare.com/profile  
**Note:** Use API tokens instead when possible

## Verification

After setting secrets, verify they work:

```bash
# Test Cloudflare API token
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"

# Should return: {"success":true,"errors":[],"messages":[],"result":{...}}
```

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use API tokens** instead of global API keys
3. **Rotate secrets** periodically (every 90 days recommended)
4. **Use least privilege** - only grant necessary permissions
5. **Monitor usage** - check Cloudflare audit logs regularly
6. **Use separate tokens** for different environments (staging/production)

## Troubleshooting

### Error: "Invalid API token"
- Verify token is correctly copied (no extra spaces)
- Check token hasn't expired
- Ensure token has required permissions

### Error: "Account not found"
- Verify CLOUDFLARE_ACCOUNT_ID is correct
- Check token has access to that account

### Error: "Zone not found"
- Verify CLOUDFLARE_ZONE_ID is correct
- Ensure domain is added to Cloudflare and using Cloudflare DNS

---

**Last Updated:** March 29, 2026  
**Status:** Ready for configuration
