#!/bin/bash

# Extract all backend API endpoints from the server
# This will download route files and analyze them

SSH_KEY="/workspace/project/Vantax-2.pem"
SERVER="ubuntu@3.10.212.143"
BACKEND_PATH="/home/ubuntu/backend/src"
OUTPUT_DIR="backend-api-documentation"

mkdir -p "$OUTPUT_DIR/routes"
mkdir -p "$OUTPUT_DIR/controllers"

echo "Downloading route files from server..."

# Download all route files
scp -i "$SSH_KEY" "$SERVER:$BACKEND_PATH/routes/*.js" "$OUTPUT_DIR/routes/" 2>/dev/null

# Download key controller files
scp -i "$SSH_KEY" "$SERVER:$BACKEND_PATH/controllers/*.js" "$OUTPUT_DIR/controllers/" 2>/dev/null

echo "Route files downloaded to $OUTPUT_DIR/routes/"
echo "Controller files downloaded to $OUTPUT_DIR/controllers/"

ls -la "$OUTPUT_DIR/routes/"
