#!/bin/bash
# Cloudflare Cache Purge Script
# Usage: ./purge-cloudflare-cache.sh [zone_id] [api_token]

set -e

ZONE_ID="${1:-$CLOUDFLARE_ZONE_ID}"
API_TOKEN="${2:-$CLOUDFLARE_API_TOKEN}"

if [ -z "$ZONE_ID" ] || [ -z "$API_TOKEN" ]; then
    echo "❌ Error: Missing Cloudflare credentials"
    echo "Usage: $0 <zone_id> <api_token>"
    echo "Or set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN environment variables"
    exit 1
fi

echo "🔄 Purging Cloudflare cache for zone: $ZONE_ID"

# Purge all cache
RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
    echo "✅ Cache purged successfully!"
    echo "⏳ Note: It may take 30 seconds for changes to propagate globally"
else
    ERRORS=$(echo "$RESPONSE" | jq -r '.errors[].message')
    echo "❌ Failed to purge cache: $ERRORS"
    exit 1
fi

# Verify cache purge
echo ""
echo "🔍 Verifying cache purge..."
sleep 5

# Check if headers include CF-Cache-Status
HEADERS=$(curl -s -I "https://tradeai.vantax.co.za" | grep -i "cf-cache-status" || true)

if [ -n "$HEADERS" ]; then
    echo "✅ Cloudflare is active: $HEADERS"
else
    echo "⚠️  Warning: Cloudflare headers not found. Check DNS configuration."
fi

echo ""
echo "📊 Next steps:"
echo "1. Wait 30 seconds for global propagation"
echo "2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo "3. Verify new version is deployed"
