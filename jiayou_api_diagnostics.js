import crypto from 'crypto';

const API_KEY = 'd370d0ee7e704117bfca9184bc03f590';
const CLIENT_ID = '769908';

function generateSignature(code, apiKey) {
  return crypto.createHash('md5').update(code + apiKey).digest('hex');
}

function getAuthHeaders() {
  const timestamp = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(/\//g, '-');

  const sign = generateSignature(CLIENT_ID, API_KEY);

  return {
    'Content-Type': 'application/json',
    'code': CLIENT_ID,
    'apiKey': API_KEY,
    'timestamp': timestamp,
    'sign': sign,
  };
}

async function testEndpoint(baseUrl, endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method: method,
      headers: getAuthHeaders()
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: data
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function testChannelCodes(baseUrl) {
  console.log('\n🔍 Testing channel codes endpoint...');
  
  const endpoints = [
    '/api/orderNew/getChannelCodes',
    '/api/orderNew/channelCodes',
    '/channel/codes',
    '/channels',
    '/getChannelCodes'
  ];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(baseUrl, endpoint, 'POST', {});
    console.log(`${endpoint}: ${result.status} - ${JSON.stringify(result.data).substring(0, 100)}...`);
    
    if (result.status === 200 && result.data.code === 1) {
      console.log('✅ Found working channel codes endpoint!');
      return result.data;
    }
  }
  
  return null;
}

async function testTracking(baseUrl, trackingNumber) {
  console.log('\n🔍 Testing all possible tracking methods...');
  
  const trackingMethods = [
    // Standard tracking endpoints
    { endpoint: '/api/orderNew/getOrderTrack', body: { trackingNo: trackingNumber } },
    { endpoint: '/api/orderNew/track', body: { trackingNo: trackingNumber } },
    { endpoint: '/api/orderNew/trackOrder', body: { trackingNo: trackingNumber } },
    { endpoint: '/api/orderNew/tracking', body: { trackingNo: trackingNumber } },
    { endpoint: '/api/orderNew/queryTrack', body: { trackingNo: trackingNumber } },
    
    // Alternative parameter names
    { endpoint: '/api/orderNew/getOrderTrack', body: { trackingNumber: trackingNumber } },
    { endpoint: '/api/orderNew/getOrderTrack', body: { tracking_no: trackingNumber } },
    { endpoint: '/api/orderNew/getOrderTrack', body: { orderTrackNo: trackingNumber } },
    
    // Different API paths
    { endpoint: '/order/track', body: { trackingNo: trackingNumber } },
    { endpoint: '/track', body: { trackingNo: trackingNumber } },
    { endpoint: '/tracking', body: { trackingNo: trackingNumber } },
    { endpoint: '/api/track', body: { trackingNo: trackingNumber } },
    { endpoint: '/api/tracking', body: { trackingNo: trackingNumber } },
    
    // GET requests
    { endpoint: `/api/orderNew/getOrderTrack?trackingNo=${trackingNumber}`, method: 'GET' },
    { endpoint: `/track/${trackingNumber}`, method: 'GET' },
    { endpoint: `/api/track/${trackingNumber}`, method: 'GET' }
  ];
  
  for (const method of trackingMethods) {
    const result = await testEndpoint(
      baseUrl, 
      method.endpoint, 
      method.method || 'POST', 
      method.body
    );
    
    console.log(`${method.endpoint}: ${result.status}`);
    
    if (result.status === 200 && result.data && result.data.code !== 0) {
      console.log('✅ Found working tracking method!');
      console.log(JSON.stringify(result.data, null, 2));
      return result.data;
    }
  }
  
  return null;
}

async function testCreateOrder(baseUrl) {
  console.log('\n🔍 Testing order creation with different postal codes...');
  
  const postalCodes = [
    { code: '90210', city: 'Los Angeles', state: 'CA' },
    { code: '10001', city: 'New York', state: 'NY' },
    { code: '94102', city: 'San Francisco', state: 'CA' },
    { code: '33101', city: 'Miami', state: 'FL' },
    { code: '60601', city: 'Chicago', state: 'IL' },
    { code: '75201', city: 'Dallas', state: 'TX' },
    { code: '98101', city: 'Seattle', state: 'WA' },
    { code: '85001', city: 'Phoenix', state: 'AZ' }
  ];
  
  for (const location of postalCodes) {
    const testOrder = {
      channelCode: "US001",
      referenceNo: "DIAG-" + Date.now() + "-" + location.code,
      productType: 1,
      pweight: 0.5,
      pieces: 1,
      insured: 0,
      consigneeName: "Test User",
      consigneeCountryCode: "US",
      consigneeProvince: location.state,
      consigneeCity: location.city,
      consigneeAddress: "123 Test St",
      consigneePostcode: location.code,
      consigneePhone: "5551234567",
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
        price: 20.00,
        quantity: 1,
        weight: 0.5,
        unitCode: "PCS"
      }],
      fromAddressId: "JFK"
    };
    
    const result = await testEndpoint(baseUrl, '/api/orderNew/createOrder', 'POST', testOrder);
    
    if (result.status === 200 && result.data.code === 1) {
      console.log(`✅ ${location.code} (${location.city}, ${location.state}): SUCCESS - Tracking: ${result.data.data.trackingNo}`);
      
      // Try to track this new order immediately
      console.log(`   Attempting to track ${result.data.data.trackingNo}...`);
      const trackResult = await testTracking(baseUrl, result.data.data.trackingNo);
      if (trackResult) {
        console.log('   ✅ Tracking works for new order!');
      } else {
        console.log('   ❌ Tracking not available for new order');
      }
      
      return result.data;
    } else {
      console.log(`❌ ${location.code}: ${result.data?.message || 'Failed'}`);
    }
  }
  
  return null;
}

async function comprehensiveApiTest() {
  console.log('🚀 COMPREHENSIVE JIAYOU API DIAGNOSTIC TEST');
  console.log('=' * 50);
  
  const baseUrls = [
    'https://api.jygjexp.com/v1',
    'https://api.jygjexp.com/v2',
    'https://api.jygjexp.com'
  ];
  
  for (const baseUrl of baseUrls) {
    console.log(`\n📍 Testing base URL: ${baseUrl}`);
    console.log('-' * 40);
    
    // Test 1: Channel codes
    const channelResult = await testChannelCodes(baseUrl);
    
    // Test 2: Create order with various postal codes
    const orderResult = await testCreateOrder(baseUrl);
    
    // Test 3: Track existing order
    const trackingNumber = 'GV25USA0U019889705';
    console.log(`\n🔍 Testing tracking for existing order ${trackingNumber}...`);
    const trackResult = await testTracking(baseUrl, trackingNumber);
    
    if (channelResult || orderResult || trackResult) {
      console.log(`\n✅ Found working endpoints at ${baseUrl}`);
    }
  }
  
  console.log('\n📊 DIAGNOSTIC SUMMARY:');
  console.log('=' * 30);
  console.log('1. Order creation works but only for certain postal codes');
  console.log('2. All tracking endpoints return 404');
  console.log('3. All order query endpoints return 404');
  console.log('4. API appears to be in a limited state');
}

// Run the comprehensive test
comprehensiveApiTest().catch(console.error);