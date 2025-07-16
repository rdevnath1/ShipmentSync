import crypto from 'crypto';

// Jiayou API credentials
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
    'accesskey': API_KEY  // Added the missing accesskey header
  };
}

async function testTrackingWithFixedAuth() {
  console.log('🔍 Testing tracking with fixed authentication...');
  
  const trackingNumber = 'GV25USA0U019889705';
  
  const trackingEndpoints = [
    '/track',
    '/tracking',
    '/order/track',
    '/order/tracking',
    '/api/track',
    '/api/tracking',
    '/api/orderNew/getOrderTrack'
  ];
  
  for (const endpoint of trackingEndpoints) {
    try {
      console.log(`\nTesting ${endpoint}...`);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ trackingNo: trackingNumber })
      });
      
      const data = await response.json();
      console.log(`Response from ${endpoint}:`, JSON.stringify(data, null, 2));
      
      if (data.code === 200 || data.code === 1) {
        console.log(`✅ SUCCESS: Found tracking data at ${endpoint}`);
        return data;
      } else if (data.code === 0 && data.message !== 'Not Found') {
        console.log(`⚠️  Tracking endpoint works but no data: ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ Error with ${endpoint}:`, error.message);
    }
  }
  
  console.log('\n❌ No tracking data found in any endpoint');
  return null;
}

async function testOrderCreation() {
  console.log('\n📦 Testing order creation with fixed authentication...');
  
  const testOrder = {
    channelCode: "US001",
    referenceNo: "TEST-FIXED-" + Date.now(),
    productType: 1,
    pweight: 0.227,
    pieces: 1,
    insured: 0,
    consigneeName: "John Doe",
    consigneeCountryCode: "US",
    consigneeProvince: "NY",
    consigneeCity: "New York",
    consigneeAddress: "123 Main St",
    consigneePostcode: "10001",
    consigneePhone: "1234567890",
    shipperName: "Test Shipper",
    shipperCountryCode: "CN",
    shipperProvince: "Beijing",
    shipperCity: "Beijing",
    shipperAddress: "Test Address",
    shipperPostcode: "100000",
    shipperPhone: "1234567890",
    apiOrderItemList: [{
      ename: "Test Item",
      sku: "TEST-001",
      price: 10.00,
      quantity: 1,
      weight: 0.227,
      unitCode: "PCS"
    }],
    fromAddressId: "JFK"
  };
  
  try {
    const response = await fetch(`${BASE_URL}/order/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(testOrder)
    });
    
    const data = await response.json();
    console.log('Order creation response:', JSON.stringify(data, null, 2));
    
    if (data.code === 200 || data.code === 1) {
      console.log('✅ SUCCESS: Order created successfully');
      return data;
    } else {
      console.log('❌ Order creation failed:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error creating order:', error.message);
    return null;
  }
}

async function runFixedAuthTests() {
  console.log('🚀 Running tests with fixed authentication...');
  console.log('=' * 50);
  
  // Test order creation first
  const orderResult = await testOrderCreation();
  
  // Test tracking
  const trackingResult = await testTrackingWithFixedAuth();
  
  console.log('\n🏁 Tests complete!');
  console.log('Order creation:', orderResult ? 'SUCCESS' : 'FAILED');
  console.log('Tracking search:', trackingResult ? 'SUCCESS' : 'FAILED');
}

// Run the tests
runFixedAuthTests().catch(console.error);