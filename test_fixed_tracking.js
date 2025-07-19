import crypto from 'crypto';

const API_KEY = 'd370d0ee7e704117bfca9184bc03f590';
const CLIENT_ID = '769908';
const BASE_URL = 'https://api.jygjexp.com/v1';

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

async function testTrackingWithFixedAuth() {
  console.log('🔍 Testing tracking with ChatGPT\'s correct endpoint');
  
  // Test both reference numbers and tracking numbers
  const testCases = [
    { name: 'Recent Order Reference', value: '100002-1752702363375-1-a9gdsxewl' },
    { name: 'Recent Tracking Number', value: 'GV25USA0U019900646' },
    { name: 'Original Order Reference', value: 'f687f803-aba5-6956-fc76-af247ce5acfc' },
    { name: 'Original Tracking Number', value: 'GV25USA0U019889705' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Testing ${testCase.name}: ${testCase.value}`);
    
    try {
      // Test the correct endpoint from ChatGPT
      const response = await fetch(`${BASE_URL}/api/orderNew/getTrackInfo`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ referenceNo: testCase.value })
      });
      
      const data = await response.json();
      
      if (response.status === 200 && data.code === 1) {
        console.log('✅ SUCCESS! Found tracking data:');
        console.log(JSON.stringify(data, null, 2));
      } else if (response.status === 200 && data.code === 0) {
        console.log('⚠️  Endpoint works but no data found:', data.message);
      } else if (response.status === 404) {
        console.log('❌ Still getting 404 - endpoint may not exist');
      } else {
        console.log(`❌ Error: ${response.status} - ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Also test the public tracking endpoint
    if (testCase.value.startsWith('GV25USA')) {
      console.log(`   Testing public endpoint for ${testCase.value}`);
      try {
        const publicResponse = await fetch(`${BASE_URL}/outerApi/getTracking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apiKey': API_KEY
          },
          body: JSON.stringify({ trackingNo: testCase.value })
        });
        
        const publicData = await publicResponse.json();
        
        if (publicResponse.status === 200 && publicData.code === 1) {
          console.log('   ✅ Public tracking works!');
          console.log('   ' + JSON.stringify(publicData, null, 2));
        } else {
          console.log('   ⚠️  Public tracking:', publicData.message);
        }
      } catch (error) {
        console.log(`   ❌ Public tracking failed: ${error.message}`);
      }
    }
  }
}

async function testOrderCreation() {
  console.log('\n🚀 Testing order creation to get fresh reference');
  
  const testOrder = {
    channelCode: "US001",
    referenceNo: "TRACK-FIX-" + Date.now(),
    productType: 1,
    pweight: 0.5,
    pieces: 1,
    insured: 0,
    consigneeName: "Track Fix Test",
    consigneeCountryCode: "US",
    consigneeProvince: "CA",
    consigneeCity: "Los Angeles",
    consigneeAddress: "456 Test Ave",
    consigneePostcode: "90210",
    consigneePhone: "3105551234",
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
      price: 25.00,
      quantity: 1,
      weight: 0.5,
      unitCode: "PCS"
    }],
    fromAddressId: "JFK"
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/orderNew/createOrder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(testOrder)
    });
    
    const data = await response.json();
    
    if (data.code === 1) {
      console.log('✅ Created fresh order for tracking test:');
      console.log(`   Order ID: ${data.data.orderId}`);
      console.log(`   Tracking: ${data.data.trackingNo}`);
      console.log(`   Reference: ${testOrder.referenceNo}`);
      
      // Now test tracking this fresh order
      console.log('\n📡 Testing tracking for fresh order...');
      
      const trackResponse = await fetch(`${BASE_URL}/api/orderNew/getTrackInfo`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ referenceNo: testOrder.referenceNo })
      });
      
      const trackData = await trackResponse.json();
      
      if (trackResponse.status === 200 && trackData.code === 1) {
        console.log('✅ TRACKING WORKS! Fresh order is trackable:');
        console.log(JSON.stringify(trackData, null, 2));
      } else {
        console.log('❌ Fresh order not trackable:', trackData.message);
      }
    } else {
      console.log('❌ Order creation failed:', data.message);
    }
  } catch (error) {
    console.log('❌ Order creation error:', error.message);
  }
}

async function runFixedAuthTests() {
  console.log('🔧 TESTING CHATGPT\'S TRACKING FIXES');
  console.log('=' * 40);
  
  await testOrderCreation();
  await testTrackingWithFixedAuth();
  
  console.log('\n📊 SUMMARY:');
  console.log('- Using correct endpoint: /api/orderNew/getTrackInfo');
  console.log('- Using correct auth headers format');
  console.log('- Testing both reference numbers and tracking numbers');
  console.log('- Also testing public endpoint: /outerApi/getTracking');
}

runFixedAuthTests().catch(console.error);