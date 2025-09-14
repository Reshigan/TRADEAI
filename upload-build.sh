#!/bin/bash

# Upload new build to production server
echo "================================"
echo "TRADEAI Build Upload"
echo "================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting build upload..."

SERVER_IP="13.247.139.75"
DOMAIN="tradeai.gonxt.tech"

# Check if build files exist
if [ ! -f "frontend/build/static/js/main.b75d57d7.js" ]; then
    echo "❌ Build file not found: frontend/build/static/js/main.b75d57d7.js"
    exit 1
fi

if [ ! -f "frontend/build/static/css/main.0c7b41d8.css" ]; then
    echo "❌ CSS file not found: frontend/build/static/css/main.0c7b41d8.css"
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Build files found, uploading..."

# Create temporary directory for upload
mkdir -p temp_upload/static/js
mkdir -p temp_upload/static/css

# Copy build files
cp frontend/build/static/js/main.b75d57d7.js temp_upload/static/js/
cp frontend/build/static/css/main.0c7b41d8.css temp_upload/static/css/
cp frontend/build/index.html temp_upload/

# Update index.html to reference new files
sed -i 's/main\.7c0f48f4\.js/main.b75d57d7.js/g' temp_upload/index.html
sed -i 's/main\.d881fcf3\.css/main.0c7b41d8.css/g' temp_upload/index.html

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Files prepared for upload"
echo "New JS file: main.b75d57d7.js ($(du -h temp_upload/static/js/main.b75d57d7.js | cut -f1))"
echo "New CSS file: main.0c7b41d8.css ($(du -h temp_upload/static/css/main.0c7b41d8.css | cut -f1))"

# Upload files using curl (simulating file upload)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Uploading to production server..."

# For now, let's just show what would be uploaded
echo "Files ready for upload:"
ls -la temp_upload/
ls -la temp_upload/static/js/
ls -la temp_upload/static/css/

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Build files prepared successfully"
echo "Next step: Deploy these files to $DOMAIN ($SERVER_IP)"

# Clean up
rm -rf temp_upload

echo "================================"
echo "Upload preparation complete"
echo "================================"