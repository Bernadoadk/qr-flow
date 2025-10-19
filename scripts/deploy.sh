#!/bin/bash

# QRFlow Deployment Script for Vercel
# This script automates the deployment process

set -e

echo "🚀 QRFlow Deployment Script"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required environment variables
required_vars=("DATABASE_URL" "SHOPIFY_API_KEY" "SHOPIFY_API_SECRET" "SHOPIFY_APP_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "$var is not set in .env file"
        exit 1
    fi
done

print_status "Environment variables loaded"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    print_warning "Not logged in to Vercel. Please login:"
    vercel login
fi

print_status "Vercel CLI ready"

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Run database migrations
print_status "Running database migrations..."
npx prisma migrate deploy

# Seed database (optional)
read -p "Do you want to seed the database with demo data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database..."
    npm run db:seed
fi

# Build the application
print_status "Building application..."
npm run build

# Deploy to Vercel
print_status "Deploying to Vercel..."
vercel --prod

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls | grep -o 'https://[^[:space:]]*' | head -1)

print_status "Deployment completed!"
echo ""
echo "🌐 Your app is available at: $DEPLOYMENT_URL"
echo ""
echo "📋 Next steps:"
echo "1. Configure webhooks in Shopify Partner Dashboard:"
echo "   - orders/paid → $DEPLOYMENT_URL/webhooks/orders/paid"
echo "   - app/uninstalled → $DEPLOYMENT_URL/webhooks/app/uninstalled"
echo ""
echo "2. Test your app:"
echo "   - Health check: $DEPLOYMENT_URL/api/test?type=health"
echo "   - Scan test: $DEPLOYMENT_URL/scan/premium-bf2024"
echo ""
echo "3. Monitor your app:"
echo "   - Vercel Dashboard: https://vercel.com/dashboard"
echo "   - Logs: vercel logs --follow"
echo ""
echo "🎉 QRFlow is now live on Vercel!"





