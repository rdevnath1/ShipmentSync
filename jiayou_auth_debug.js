import crypto from 'crypto';

// Current API credentials
const API_KEY = 'd370d0ee7e704117bfca9184bc03f590';
const CLIENT_ID = '769908';
const BASE_URL = 'https://api.jygjexp.com/v1';

function generateSignature(code, apiKey) {
  return crypto.createHash('md5').update(code + apiKey).digest('hex');
}

function getAuthHeaders() {
  const code = Date.now().toString();
  const signature = generateSignature(code, API_KEY);
  
  return {
    'Content-Type': 'application/json',
    'code': code,
    'signature': signature,
    'clientId': CLIENT_ID,
    'accesskey': API_KEY
  };
}

async function checkApiKeyStatus() {
  console.log('🔐 Checking API key status...');
  console.log('Current API Key:', API_KEY);
  console.log('Current Client ID:', CLIENT_ID);
  
  // Try a simple test endpoint
  const testEndpoints = [
    '/order/create',
    '/api/test',
    '/health',
    '/status'
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ test: true })
      });
      
      const data = await response.json();
      console.log(`\n${endpoint} response:`, JSON.stringify(data, null, 2));
      
      if (data.message && data.message.includes('accesskey')) {
        console.log(`❌ API Key Issue: ${data.message}`);
      }
    } catch (error) {
      console.log(`Error with ${endpoint}:`, error.message);
    }
  }
}

async function testDifferentAuthMethods() {
  console.log('\n🔄 Testing different authentication methods...');
  
  const authMethods = [
    // Method 1: Current approach
    {
      name: 'Current Method',
      headers: getAuthHeaders()
    },
    // Method 2: Different header names
    {
      name: 'Alternative Headers',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'clientid': CLIENT_ID,
        'timestamp': Date.now().toString()
      }
    },
    // Method 3: Token-based auth
    {
      name: 'Token Auth',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-Client-ID': CLIENT_ID
      }
    },
    // Method 4: Basic auth
    {
      name: 'Basic Auth',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${API_KEY}`).toString('base64')}`
      }
    }
  ];
  
  for (const method of authMethods) {
    try {
      console.log(`\nTesting ${method.name}...`);
      const response = await fetch(`${BASE_URL}/order/create`, {
        method: 'POST',
        headers: method.headers,
        body: JSON.stringify({ test: true })
      });
      
      const data = await response.json();
      console.log(`${method.name} response:`, JSON.stringify(data, null, 2));
      
      if (data.code === 200 || data.code === 1) {
        console.log(`✅ SUCCESS: ${method.name} works!`);
      } else if (!data.message.includes('accesskey')) {
        console.log(`⚠️  ${method.name} might be closer to working`);
      }
    } catch (error) {
      console.log(`❌ Error with ${method.name}:`, error.message);
    }
  }
}

async function debugTrackingIssue() {
  console.log('\n📋 COMPREHENSIVE JIAYOU TRACKING DEBUG REPORT');
  console.log('=' * 60);
  
  console.log('\n🔍 ISSUE SUMMARY:');
  console.log('- Tracking number GV25USA0U019889705 cannot be found in Jiayou backend');
  console.log('- API authentication may be failing');
  console.log('- All tracking endpoints return 404 Not Found');
  
  console.log('\n📊 AUTHENTICATION ANALYSIS:');
  await checkApiKeyStatus();
  
  console.log('\n🧪 AUTHENTICATION TESTING:');
  await testDifferentAuthMethods();
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Contact Jiayou support to verify API key status');
  console.log('2. Check if API key needs renewal');
  console.log('3. Verify the API documentation for correct authentication method');
  console.log('4. Test with a different API key if available');
  console.log('5. Check if tracking requires different credentials than order creation');
  
  console.log('\n🔗 NEXT STEPS:');
  console.log('1. Get updated API credentials from Jiayou');
  console.log('2. Verify the correct API base URL and version');
  console.log('3. Test with a fresh order creation to get a new tracking number');
  console.log('4. Check if there are separate credentials for tracking vs order management');
  
  console.log('\n📞 CONTACT JIAYOU SUPPORT:');
  console.log('- Mention that API key d370d0ee7e704117bfca9184bc03f590 is not recognized');
  console.log('- Ask for updated API documentation');
  console.log('- Request verification of tracking endpoints');
  console.log('- Inquire about any recent API changes');
}

// Run the debug
debugTrackingIssue().catch(console.error);