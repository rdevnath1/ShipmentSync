#!/bin/bash

# FedEx Direct Integration Dry Run Script
# This script helps you test FedEx integration with your customer's credentials

echo "🚀 FedEx Direct Integration Dry Run"
echo "====================================="

# Check if server is running
echo "📡 Checking if Quikpik server is running..."
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "✅ Server is running on port 3002"
else
    echo "❌ Server is not running on port 3002"
    echo "💡 Start the server first:"
    echo "   npm run dev"
    echo "   # or"
    echo "   ./start.sh"
    exit 1
fi

# Check for credentials
echo ""
echo "🔐 Checking FedEx credentials..."

if [ -z "$FEDEX_CLIENT_ID" ] || [ "$FEDEX_CLIENT_ID" = "YOUR_FEDEX_CLIENT_ID" ]; then
    echo "❌ FEDEX_CLIENT_ID not set"
    MISSING_CREDS=1
fi

if [ -z "$FEDEX_CLIENT_SECRET" ] || [ "$FEDEX_CLIENT_SECRET" = "YOUR_FEDEX_CLIENT_SECRET" ]; then
    echo "❌ FEDEX_CLIENT_SECRET not set"
    MISSING_CREDS=1
fi

if [ -z "$FEDEX_ACCOUNT_NUMBER" ] || [ "$FEDEX_ACCOUNT_NUMBER" = "YOUR_FEDEX_ACCOUNT_NUMBER" ]; then
    echo "❌ FEDEX_ACCOUNT_NUMBER not set"
    MISSING_CREDS=1
fi

if [ "$MISSING_CREDS" = "1" ]; then
    echo ""
    echo "⚠️  FedEx credentials not configured!"
    echo ""
    echo "🔧 To set up credentials, choose ONE of these options:"
    echo ""
    echo "Option 1: Set environment variables (recommended for testing):"
    echo "export FEDEX_API_URL='https://apis-sandbox.fedex.com'"
    echo "export FEDEX_CLIENT_ID='your_client_id_here'"
    echo "export FEDEX_CLIENT_SECRET='your_client_secret_here'"
    echo "export FEDEX_ACCOUNT_NUMBER='your_account_number_here'"
    echo ""
    echo "Option 2: Edit the test script directly:"
    echo "nano test_fedex_direct_integration.js"
    echo ""
    echo "Option 3: Configure via Quikpik Settings UI:"
    echo "http://localhost:3002 → Settings → FedEx tab"
    echo ""
    read -p "❓ Do you want to continue with demo mode? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "👋 Set up credentials and run again!"
        exit 1
    fi
    echo "🎭 Running in DEMO mode (will show credential setup process)"
fi

echo ""
echo "🧪 Running FedEx integration tests..."
echo ""

# Run the test script
node test_fedex_direct_integration.js

echo ""
echo "✨ Dry run complete!"
echo ""
echo "📋 Next steps:"
echo "1. If tests passed: You're ready for production!"
echo "2. If tests failed: Check credentials and server logs"
echo "3. Switch to production: Change API URL to https://apis.fedex.com"
echo ""
echo "🎯 For production setup:"
echo "export FEDEX_API_URL='https://apis.fedex.com'"