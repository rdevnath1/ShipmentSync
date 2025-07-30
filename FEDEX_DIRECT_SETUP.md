# FedEx Direct Integration Setup Guide

## Overview
Quikpik now supports **direct FedEx API integration** for label printing and shipment creation. This allows you to use your own FedEx account credentials instead of going through ShipEngine.

## ✅ What's Available

### 1. **Direct FedEx Rate Fetching**
- Real-time rates using your FedEx account
- Account-specific pricing and discounts
- Multiple service types (Ground, Express, Overnight, etc.)

### 2. **FedEx Label Creation**
- Generate shipping labels directly from FedEx
- PDF format labels (4x6 standard)
- Tracking number generation
- Cost calculation

### 3. **FedEx Tracking**
- Real-time tracking updates
- Detailed scan information
- Delivery confirmation

## 🔧 Setup Instructions

### Step 1: Get FedEx API Credentials

1. **Create FedEx Developer Account**
   - Visit [FedEx Developer Portal](https://developer.fedex.com/)
   - Sign up for a developer account
   - Create a new application

2. **Obtain Required Credentials**
   - **Client ID**: Your application's client identifier
   - **Client Secret**: Your application's secret key
   - **Account Number**: Your 9-digit FedEx account number
   - **API URL**: Use `https://apis-sandbox.fedex.com` for testing, `https://apis.fedex.com` for production

### Step 2: Configure in Quikpik

#### Option A: Via Web Interface
1. Login to Quikpik
2. Go to **Settings** → **FedEx** tab
3. Enter your credentials:
   - ✅ Enable FedEx Integration
   - Account Number: `123456789`
   - Client ID: `your_client_id_here`
   - Client Secret: `your_client_secret_here`
   - API Environment: Choose Sandbox or Production
4. Click **Save FedEx Settings**

#### Option B: Via Environment Variables
```bash
export FEDEX_API_URL="https://apis-sandbox.fedex.com"
export FEDEX_CLIENT_ID="your_client_id_here"
export FEDEX_CLIENT_SECRET="your_client_secret_here"
export FEDEX_ACCOUNT_NUMBER="123456789"
```

### Step 3: Test the Integration

Run the test script to verify everything works:

```bash
# 1. Update credentials in the test script
nano test_fedex_direct_integration.js

# 2. Run the test
node test_fedex_direct_integration.js
```

## 📡 API Endpoints

### Get FedEx Rates
```bash
POST /api/fedex/rates
{
  "fromZip": "90210",
  "toZip": "10001", 
  "weight": 2.5,
  "dimensions": {
    "length": 12,
    "width": 9,
    "height": 3
  }
}
```

### Create FedEx Shipment
```bash
POST /api/fedex/shipment
{
  "fromAddress": {
    "name": "Your Business",
    "street1": "123 Business St",
    "city": "Los Angeles",
    "state": "CA",
    "postalCode": "90210",
    "country": "US"
  },
  "toAddress": {
    "name": "Customer Name",
    "street1": "456 Customer Ave",
    "city": "New York", 
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "weight": 2.5,
  "serviceType": "FEDEX_GROUND"
}
```

### Track FedEx Shipment
```bash
GET /api/fedex/track/1234567890
```

## 🔄 Integration with Existing Workflow

The FedEx direct integration works alongside your existing setup:

1. **Rate Shopping**: FedEx rates can be included in rate comparisons
2. **Order Processing**: Create FedEx labels directly from orders
3. **ShipStation Updates**: FedEx tracking numbers are automatically synced
4. **Audit Logging**: All FedEx operations are logged for compliance

## 🚨 Important Notes

### Sandbox vs Production
- **Always test with Sandbox first**: `https://apis-sandbox.fedex.com`
- **Switch to Production** when ready: `https://apis.fedex.com`
- **Sandbox tracking numbers** won't work with real FedEx tracking

### Rate Accuracy
- Direct FedEx rates reflect your actual account pricing
- Include negotiated discounts and volume pricing
- More accurate than generic rate calculators

### Label Requirements
- **From Address**: Must be associated with your FedEx account
- **Packaging**: Use appropriate packaging type for service
- **Weight/Dimensions**: Must be accurate for proper rating

## 🛠️ Troubleshooting

### Common Issues

**"FedEx API credentials not configured"**
- Verify credentials are saved in Settings
- Check that all required fields are filled
- Ensure API URL is correct (sandbox vs production)

**"Authentication failed"**
- Double-check Client ID and Client Secret
- Verify credentials haven't expired
- Check FedEx Developer Portal for account status

**"Invalid account number"**
- Ensure 9-digit account number is correct
- Verify account is active and in good standing
- Check that account supports API access

**"Label creation failed"**
- Verify from address is valid for your account
- Check package weight and dimensions
- Ensure destination address is complete

### Support

If you encounter issues:

1. **Check the test script output** for detailed error messages
2. **Review server logs** for FedEx API responses
3. **Verify credentials** in FedEx Developer Portal
4. **Contact support** with specific error messages

## 🎯 Next Steps

Once FedEx direct integration is working:

1. **Configure rate shopping** to include FedEx in comparisons
2. **Set up automated workflows** for high-volume processing
3. **Monitor costs** and optimize service selection
4. **Scale up** to production when ready

---

**Your customers now have direct access to FedEx services with their own credentials!** 🎉