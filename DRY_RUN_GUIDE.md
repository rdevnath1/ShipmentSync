# FedEx Direct Integration - Dry Run Guide

## 🎯 Quick Start (2 minutes)

### Step 1: Start the Server
```bash
# Make sure you're in the Quikpik directory
cd /path/to/Quikpik

# Start the server
./start.sh
# OR
npm run dev
```

### Step 2: Run the Dry Run
```bash
# Simple dry run (will guide you through setup)
./fedex_dry_run.sh
```

**That's it!** The script will check everything and guide you through the process.

---

## 🔧 Detailed Setup Options

### Option 1: Environment Variables (Recommended)

```bash
# Set your FedEx credentials
export FEDEX_API_URL="https://apis-sandbox.fedex.com"
export FEDEX_CLIENT_ID="your_actual_client_id"
export FEDEX_CLIENT_SECRET="your_actual_client_secret" 
export FEDEX_ACCOUNT_NUMBER="your_9_digit_account"

# Run the test
./fedex_dry_run.sh
```

### Option 2: Direct Script Edit

```bash
# Edit the test file
nano test_fedex_direct_integration.js

# Find this section and update:
fedexCredentials: {
  apiUrl: 'https://apis-sandbox.fedex.com',
  clientId: 'YOUR_ACTUAL_CLIENT_ID',        // ← Update this
  clientSecret: 'YOUR_ACTUAL_CLIENT_SECRET', // ← Update this
  accountNumber: 'YOUR_ACTUAL_ACCOUNT'       // ← Update this
}

# Run the test
node test_fedex_direct_integration.js
```

### Option 3: UI Configuration

```bash
# 1. Start server
./start.sh

# 2. Open browser
open http://localhost:3002

# 3. Go to Settings → FedEx tab
# 4. Enter credentials and save
# 5. Run test
./fedex_dry_run.sh
```

---

## 🧪 What the Dry Run Tests

### ✅ Test 1: Authentication & Rate Fetching
- Tests OAuth token generation
- Fetches real FedEx rates for LA → NY shipment
- Validates account access and pricing

### ✅ Test 2: Shipment Creation & Label Generation  
- Creates actual FedEx shipment
- Generates PDF shipping label
- Returns tracking number

### ✅ Test 3: Tracking Integration
- Tests tracking API with generated tracking number
- Retrieves shipment status and scan data

---

## 📊 Expected Output

### ✅ Success Output
```
🚀 FedEx Direct Integration Dry Run
=====================================
📡 Checking if Quikpik server is running...
✅ Server is running on port 3002

🔐 Checking FedEx credentials...
✅ All required credentials are configured

🧪 Running FedEx integration tests...

📊 Testing FedEx Rate Fetching...
✅ FedEx rates retrieved successfully!
📋 Available services:
   1. FedEx Ground: $12.85 (2-3 days)
   2. FedEx Express Saver: $24.50 (3 days)
   3. FedEx 2Day: $31.75 (2 days)

📦 Testing FedEx Shipment Creation...
✅ FedEx shipment created successfully!
📋 Shipment details:
   📍 Tracking Number: 1234567890123
   💰 Total Cost: $12.85
   📄 Label URL: https://...pdf
   📅 Estimated Delivery: 2024-01-15

🔍 Testing FedEx Tracking...
✅ FedEx tracking retrieved successfully!
📋 Tracking information:
   📍 Tracking Number: 1234567890123
   📊 Tracking Data: Available

============================================================
📊 TEST RESULTS SUMMARY
============================================================
📊 FedEx Rate Fetching:    ✅ PASS
📦 FedEx Shipment Creation: ✅ PASS  
🔍 FedEx Tracking:         ✅ PASS

🎯 Overall Status: ✅ ALL TESTS PASSED

🎉 FedEx Direct Integration is working perfectly!
💡 Your customers can now use direct FedEx label printing
```

### ⚠️ Need Credentials Output
```
🚀 FedEx Direct Integration Dry Run
=====================================
📡 Checking if Quikpik server is running...
✅ Server is running on port 3002

🔐 Checking FedEx credentials...
❌ FEDEX_CLIENT_ID not set
❌ FEDEX_CLIENT_SECRET not set
❌ FEDEX_ACCOUNT_NUMBER not set

⚠️  FedEx credentials not configured!

🔧 To set up credentials, choose ONE of these options:

Option 1: Set environment variables (recommended for testing):
export FEDEX_API_URL='https://apis-sandbox.fedex.com'
export FEDEX_CLIENT_ID='your_client_id_here'
export FEDEX_CLIENT_SECRET='your_client_secret_here'
export FEDEX_ACCOUNT_NUMBER='your_account_number_here'

Option 2: Edit the test script directly:
nano test_fedex_direct_integration.js

Option 3: Configure via Quikpik Settings UI:
http://localhost:3002 → Settings → FedEx tab
```

---

## 🚨 Troubleshooting

### Server Not Running
```bash
❌ Server is not running on port 3002
💡 Start the server first:
   ./start.sh
```
**Solution**: Run `./start.sh` or `npm run dev`

### Authentication Failed
```bash
❌ FedEx rates error: Failed to authenticate with FedEx
```
**Solutions**:
1. Double-check Client ID and Client Secret
2. Verify credentials in FedEx Developer Portal
3. Ensure account is active

### Invalid Account Number
```bash
❌ FedEx shipment creation failed: Invalid account number
```
**Solutions**:
1. Verify 9-digit account number is correct
2. Check account is in good standing
3. Ensure account supports API access

### Network Issues
```bash
❌ FedEx API error: Network timeout
```
**Solutions**:
1. Check internet connection
2. Verify FedEx API endpoints are accessible
3. Try switching between sandbox/production URLs

---

## 🎯 Production Checklist

Once dry run passes:

### ✅ Switch to Production
```bash
# Change to production API
export FEDEX_API_URL="https://apis.fedex.com"

# Test again
./fedex_dry_run.sh
```

### ✅ Validate Production Settings
- [ ] Production credentials work
- [ ] Labels print correctly
- [ ] Tracking numbers are valid
- [ ] Costs match expected rates

### ✅ Go Live!
- [ ] Configure in Quikpik Settings UI
- [ ] Train users on new FedEx features
- [ ] Monitor for any issues

---

## 💡 Pro Tips

### Testing Tips
- **Always start with sandbox** (`https://apis-sandbox.fedex.com`)
- **Use test addresses** for initial runs
- **Verify label PDFs** open correctly
- **Check tracking numbers** work on fedex.com

### Production Tips  
- **Monitor API quotas** to avoid limits
- **Set up error alerting** for failed shipments
- **Keep credentials secure** (environment variables)
- **Regular testing** to catch API changes

---

**Ready to test? Run `./fedex_dry_run.sh` and let's see FedEx direct integration in action!** 🚀