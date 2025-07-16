import crypto from 'crypto';

// Jiayou API credentials
const API_KEY = 'd370d0ee7e704117bfca9184bc03f590';
const CLIENT_ID = '769908';

// Try different base URLs
const BASE_URLS = [
  'https://api.jygjexp.com/v1',
  'https://api.jygjexp.com/v2',
  'https://api.jygjexp.com/api/v1',
  'https://api.jygjexp.com/api/v2',
  'https://api.jygjexp.com',
  'https://openapi.jygjexp.com/v1',
  'https://openapi.jygjexp.com/v2',
  'https://openapi.jygjexp.com/api/v1',
  'https://openapi.jygjexp.com/api/v2',
  'https://openapi.jygjexp.com',
];

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
    'clientId': CLIENT_ID
  };
}

async function testEndpoint(baseUrl, endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method: method,
      headers: getAuthHeaders()
    };
    
    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testChannelCodes(baseUrl) {
  console.log(`\n📋 Testing channel codes at ${baseUrl}`);
  
  const endpoints = [
    '/channels',
    '/channel/list',
    '/channel/codes',
    '/api/channels',
    '/api/channel/list',
    '/getChannels',
    '/channelCodes'
  ];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(baseUrl, endpoint, 'GET');
    console.log(`  ${endpoint}: ${result.success ? '✅' : '❌'} (${result.status || 'error'})`);
    if (result.success) {
      console.log(`    Data:`, JSON.stringify(result.data, null, 2));
    }
  }
}

async function testTracking(baseUrl, trackingNumber) {
  console.log(`\n🔍 Testing tracking at ${baseUrl}`);
  
  const endpoints = [
    { path: '/track', method: 'POST', body: { trackingNo: trackingNumber } },
    { path: '/tracking', method: 'POST', body: { trackingNo: trackingNumber } },
    { path: '/api/track', method: 'POST', body: { trackingNo: trackingNumber } },
    { path: '/api/tracking', method: 'POST', body: { trackingNo: trackingNumber } },
    { path: `/track/${trackingNumber}`, method: 'GET' },
    { path: `/tracking/${trackingNumber}`, method: 'GET' },
    { path: `/api/track/${trackingNumber}`, method: 'GET' },
    { path: `/api/tracking/${trackingNumber}`, method: 'GET' },
  ];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(baseUrl, endpoint.path, endpoint.method, endpoint.body);
    console.log(`  ${endpoint.method} ${endpoint.path}: ${result.success ? '✅' : '❌'} (${result.status || 'error'})`);
    if (result.success) {
      console.log(`    Data:`, JSON.stringify(result.data, null, 2));
    }
  }
}

async function testCreateOrder(baseUrl) {
  console.log(`\n📦 Testing create order at ${baseUrl}`);
  
  const testOrder = {
    channelCode: "US001",
    referenceNo: "TEST-" + Date.now(),
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
  
  const endpoints = [
    '/order/create',
    '/orders/create',
    '/api/order/create',
    '/api/orders/create',
    '/createOrder',
    '/order',
    '/orders'
  ];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(baseUrl, endpoint, 'POST', testOrder);
    console.log(`  POST ${endpoint}: ${result.success ? '✅' : '❌'} (${result.status || 'error'})`);
    if (result.success) {
      console.log(`    Data:`, JSON.stringify(result.data, null, 2));
    } else if (result.data) {
      console.log(`    Error:`, JSON.stringify(result.data, null, 2));
    }
  }
}

async function comprehensiveApiTest() {
  console.log('🚀 Starting comprehensive Jiayou API diagnostics...');
  console.log('=' * 60);
  
  const trackingNumber = 'GV25USA0U019889705';
  
  for (const baseUrl of BASE_URLS) {
    console.log(`\n🌐 Testing base URL: ${baseUrl}`);
    console.log('-' * 40);
    
    // Test basic connectivity
    try {
      const response = await fetch(baseUrl);
      console.log(`  Base URL accessible: ${response.ok ? '✅' : '❌'} (${response.status})`);
    } catch (error) {
      console.log(`  Base URL accessible: ❌ (${error.message})`);
      continue; // Skip this URL if it's not accessible
    }
    
    // Test channel codes
    await testChannelCodes(baseUrl);
    
    // Test tracking
    await testTracking(baseUrl, trackingNumber);
    
    // Test create order
    await testCreateOrder(baseUrl);
  }
  
  console.log('\n🏁 API diagnostics complete!');
}

// Run the comprehensive test
comprehensiveApiTest().catch(console.error);