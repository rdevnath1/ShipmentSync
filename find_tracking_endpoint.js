import crypto from 'crypto';

const API_KEY = 'd370d0ee7e704117bfca9184bc03f590';
const CLIENT_ID = '769908';

function generateSignature(clientId, apiKey) {
  return crypto.createHash('md5').update(clientId + apiKey).digest('hex');
}

function getWorkingAuthHeaders() {
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

async function testAllTrackingEndpoints() {
  console.log('🔍 Testing all possible tracking endpoints with working auth...');
  
  const trackingNumber = 'GV25USA0U019889705';
  const jiayouOrderId = '135994042';
  
  const endpoints = [
    // Different API versions
    { url: 'https://api.jygjexp.com/v1/api/orderNew/getOrderTrack', body: { trackingNo: trackingNumber } },
    { url: 'https://api.jygjexp.com/v1/api/orderNew/track', body: { trackingNo: trackingNumber } },
    { url: 'https://api.jygjexp.com/v1/api/orderNew/tracking', body: { trackingNo: trackingNumber } },
    { url: 'https://api.jygjexp.com/v1/api/orderNew/queryTrack', body: { trackingNo: trackingNumber } },
    
    // Try with order ID instead
    { url: 'https://api.jygjexp.com/v1/api/orderNew/getOrderTrack', body: { orderId: jiayouOrderId } },
    { url: 'https://api.jygjexp.com/v1/api/orderNew/track', body: { orderId: jiayouOrderId } },
    { url: 'https://api.jygjexp.com/v1/api/orderNew/queryOrder', body: { orderId: jiayouOrderId } },
    
    // Different base paths
    { url: 'https://api.jygjexp.com/v1/track', body: { trackingNo: trackingNumber } },
    { url: 'https://api.jygjexp.com/v1/tracking', body: { trackingNo: trackingNumber } },
    { url: 'https://api.jygjexp.com/v1/order/track', body: { trackingNo: trackingNumber } },
    { url: 'https://api.jygjexp.com/v1/order/tracking', body: { trackingNo: trackingNumber } },
    { url: 'https://api.jygjexp.com/v1/order/query', body: { trackingNo: trackingNumber } },
    { url: 'https://api.jygjexp.com/v1/order/detail', body: { orderId: jiayouOrderId } },
    
    // Try different parameter names
    { url: 'https://api.jygjexp.com/v1/api/orderNew/getOrderTrack', body: { trackingNumber: trackingNumber } },
    { url: 'https://api.jygjexp.com/v1/api/orderNew/getOrderTrack', body: { tracking_no: trackingNumber } },
    { url: 'https://api.jygjexp.com/v1/api/orderNew/getOrderTrack', body: { orderTrackNo: trackingNumber } },
    
    // Try GET requests
    { url: `https://api.jygjexp.com/v1/api/orderNew/getOrderTrack/${trackingNumber}`, method: 'GET' },
    { url: `https://api.jygjexp.com/v1/track/${trackingNumber}`, method: 'GET' },
    { url: `https://api.jygjexp.com/v1/order/track/${trackingNumber}`, method: 'GET' },
  ];

  let successCount = 0;
  
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`\n${i + 1}. Testing ${endpoint.url}...`);
    
    try {
      const options = {
        method: endpoint.method || 'POST',
        headers: getWorkingAuthHeaders()
      };
      
      if (endpoint.body && (endpoint.method !== 'GET')) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(endpoint.url, options);
      const data = await response.json();
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(data, null, 2));
      
      if (response.status === 200 && data.code !== 0) {
        console.log(`   ✅ POTENTIAL SUCCESS: Found working endpoint!`);
        successCount++;
      } else if (response.status === 200 && data.code === 0 && !data.message.includes('不存在')) {
        console.log(`   ⚠️  ENDPOINT WORKS: But may have validation issues`);
      } else if (response.status === 404) {
        console.log(`   ❌ NOT FOUND: Endpoint doesn't exist`);
      } else {
        console.log(`   ❌ FAILED: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }
  
  console.log(`\n📊 RESULTS: Found ${successCount} potentially working endpoints`);
  return successCount > 0;
}

async function testOrderQuery() {
  console.log('\n🔍 Testing order query to verify the order exists...');
  
  const jiayouOrderId = '135994042';
  
  const orderEndpoints = [
    { url: 'https://api.jygjexp.com/v1/api/orderNew/queryOrder', body: { orderId: jiayouOrderId } },
    { url: 'https://api.jygjexp.com/v1/api/orderNew/getOrder', body: { orderId: jiayouOrderId } },
    { url: 'https://api.jygjexp.com/v1/api/orderNew/orderDetail', body: { orderId: jiayouOrderId } },
    { url: 'https://api.jygjexp.com/v1/order/detail', body: { orderId: jiayouOrderId } },
    { url: 'https://api.jygjexp.com/v1/order/query', body: { orderId: jiayouOrderId } },
  ];
  
  for (const endpoint of orderEndpoints) {
    try {
      console.log(`\nTesting ${endpoint.url}...`);
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: getWorkingAuthHeaders(),
        body: JSON.stringify(endpoint.body)
      });
      
      const data = await response.json();
      console.log(`Response:`, JSON.stringify(data, null, 2));
      
      if (response.status === 200 && data.code === 1) {
        console.log('✅ ORDER FOUND: This confirms the order exists in Jiayou system');
        return true;
      } else if (response.status === 200 && data.code === 0 && !data.message.includes('不存在')) {
        console.log('⚠️  Order endpoint works but may have validation issues');
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
  
  return false;
}

async function comprehensiveTrackingTest() {
  console.log('🔍 COMPREHENSIVE TRACKING ENDPOINT DISCOVERY');
  console.log('=' * 50);
  
  console.log('\n📋 TESTING HYPOTHESIS:');
  console.log('- API key works for order creation');
  console.log('- Tracking endpoints may have different URLs');
  console.log('- Order exists in Jiayou system (ID: 135994042)');
  console.log('- Tracking number: GV25USA0U019889705');
  
  // Test 1: Try to find order in system
  const orderExists = await testOrderQuery();
  
  // Test 2: Try all tracking endpoints
  const trackingFound = await testAllTrackingEndpoints();
  
  console.log('\n🎯 FINAL CONCLUSION:');
  console.log('=' * 20);
  
  if (orderExists) {
    console.log('✅ Order exists in Jiayou system');
  } else {
    console.log('❌ Cannot verify order exists in Jiayou system');
  }
  
  if (trackingFound) {
    console.log('✅ Found working tracking endpoint');
  } else {
    console.log('❌ No working tracking endpoints found');
    console.log('\nPossible reasons:');
    console.log('1. Tracking endpoints are on different API version');
    console.log('2. Tracking requires different authentication');
    console.log('3. Tracking information is not yet available (time delay)');
    console.log('4. Tracking endpoints are deprecated/changed');
  }
}

// Run the test
comprehensiveTrackingTest().catch(console.error);