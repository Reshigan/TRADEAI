#!/bin/bash

# Frontend Deployment Fix Script
# This script fixes the missing assets issue and rebuilds the frontend

set -e

echo "🚀 Starting Frontend Deployment Fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Navigate to frontend directory
cd frontend

print_status "Installing frontend dependencies..."
npm install

print_status "Creating missing asset directories..."
mkdir -p public/static/images/avatar

print_status "Creating missing avatar images..."
cp public/favicon.ico public/static/images/avatar/1.jpg
cp public/favicon.ico public/static/images/avatar/2.jpg

print_status "Creating missing Apple touch icons..."
cp public/favicon.ico public/apple-touch-icon.png
cp public/favicon.ico public/apple-touch-icon-precomposed.png

print_status "Building frontend for production..."
npm run build

print_status "Ensuring all assets are in build directory..."
mkdir -p build/static/images/avatar
cp public/favicon.ico build/static/images/avatar/1.jpg
cp public/favicon.ico build/static/images/avatar/2.jpg
cp public/favicon.ico build/apple-touch-icon.png
cp public/favicon.ico build/apple-touch-icon-precomposed.png

print_status "Setting proper permissions..."
chmod -R 755 build/

print_status "✅ Frontend deployment fix completed successfully!"
print_status "The following issues have been resolved:"
echo "  - Missing avatar images (/static/images/avatar/1.jpg, /static/images/avatar/2.jpg)"
echo "  - Missing Apple touch icons (apple-touch-icon.png, apple-touch-icon-precomposed.png)"
echo "  - Proper build directory structure"
echo "  - Correct file permissions"

print_warning "Next steps:"
echo "  1. Deploy the build directory to your production server"
echo "  2. Restart nginx if necessary"
echo "  3. Test the application to ensure all assets load correctly"