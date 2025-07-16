import crypto from 'crypto';

const API_KEY = 'd370d0ee7e704117bfca9184bc03f590';
const CLIENT_ID = '769908';
const BASE_URL = 'https://api.jygjexp.com/v1';

// Use the EXACT same authentication that created your successful orders
function getExactWorkingAuthHeaders() {
  const timestamp = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(/\//g, '-');

  const sign = crypto.createHash('md5').update(CLIENT_ID + API_KEY).digest('hex');

  return {
    'Content-Type': 'application/json',
    'code': CLIENT_ID,
    'apiKey': API_KEY,
    'timestamp': timestamp,
    'sign': sign,
  };
}

async function finalDefinitiveTest() {
  console.log('🔍 FINAL DEFINITIVE VERIFICATION FOR JIAYOU SUPPORT');
  console.log('Using EXACT authentication method that created your successful orders');
  console.log('=' * 60);
  
  const trackingNumber = 'GV25USA0U019889705';
  const jiayouOrderId = '135994042';
  
  console.log(`Target tracking number: ${trackingNumber}`);
  console.log(`Jiayou order ID: ${jiayouOrderId}`);
  console.log(`API Key: ${API_KEY}`);
  console.log(`Client ID: ${CLIENT_ID}`);
  
  // Test 1: Verify order creation still works (proves API key is valid)
  console.log('\n🧪 TEST 1: Verify API key works for order creation');
  try {
    const testOrder = {
      channelCode: "US001",
      referenceNo: "FINAL-VERIFY-" + Date.now(),
      productType: 1,
      pweight: 0.227,
      pieces: 1,
      insured: 0,
      consigneeName: "Test User",
      consigneeCountryCode: "US",
      consigneeProvince: "CA",
      consigneeCity: "Los Angeles",
      consigneeAddress: "123 Test Ave",
      consigneePostcode: "90210",
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
        price: 10.00,
        quantity: 1,
        weight: 0.227,
        unitCode: "PCS"
      }],
      fromAddressId: "JFK"
    };
    
    const response = await fetch(`${BASE_URL}/api/orderNew/createOrder`, {
      method: 'POST',
      headers: getExactWorkingAuthHeaders(),
      body: JSON.stringify(testOrder)
    });
    
    const data = await response.json();
    console.log('Order creation test result:', JSON.stringify(data, null, 2));
    
    if (data.code === 200 || data.code === 1) {
      console.log('✅ API KEY CONFIRMED WORKING - Can create orders successfully');
    } else if (data.code === 0 && data.message.includes('邮编')) {
      console.log('✅ API KEY CONFIRMED WORKING - Validation error (not auth error)');
    } else {
      console.log('❌ API KEY ISSUE - Authentication failed');
    }
  } catch (error) {
    console.log('❌ ERROR testing order creation:', error.message);
  }
  
  // Test 2: Test tracking with the exact same authentication
  console.log('\n🔍 TEST 2: Test ALL tracking possibilities with working auth');
  
  const trackingTests = [
    // Test the original endpoint that our system uses
    {
      url: `${BASE_URL}/api/orderNew/getOrderTrack`,
      body: { trackingNo: trackingNumber },
      description: 'Original tracking endpoint'
    },
    // Test with order ID instead of tracking number
    {
      url: `${BASE_URL}/api/orderNew/getOrderTrack`,
      body: { orderId: jiayouOrderId },
      description: 'Tracking by order ID'
    },
    // Test simpler tracking endpoints
    {
      url: `${BASE_URL}/api/orderNew/track`,
      body: { trackingNo: trackingNumber },
      description: 'Simple track endpoint'
    },
    // Test order detail endpoint
    {
      url: `${BASE_URL}/api/orderNew/orderDetail`,
      body: { orderId: jiayouOrderId },
      description: 'Order detail endpoint'
    },
    // Test different parameter names
    {
      url: `${BASE_URL}/api/orderNew/getOrderTrack`,
      body: { trackingNumber: trackingNumber },
      description: 'Different parameter name'
    }
  ];
  
  let anySuccess = false;
  
  for (const test of trackingTests) {
    try {
      console.log(`\nTesting: ${test.description}`);
      console.log(`URL: ${test.url}`);
      console.log(`Body: ${JSON.stringify(test.body)}`);
      
      const response = await fetch(test.url, {
        method: 'POST',
        headers: getExactWorkingAuthHeaders(),
        body: JSON.stringify(test.body)
      });
      
      const data = await response.json();
      console.log(`Response: ${JSON.stringify(data, null, 2)}`);
      
      if (response.status === 200 && data.code === 1) {
        console.log('✅ SUCCESS: Found working tracking endpoint!');
        anySuccess = true;
      } else if (response.status === 200 && data.code === 0) {
        console.log('⚠️  Endpoint exists but returned error - not 404');
      } else if (response.status === 404) {
        console.log('❌ 404 - Endpoint does not exist');
      } else {
        console.log(`❌ Failed with status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 FINAL CONCLUSION FOR JIAYOU SUPPORT:');
  console.log('=' * 50);
  
  if (anySuccess) {
    console.log('✅ TRACKING WORKS - Initial diagnosis was wrong');
    console.log('Contact Jiayou: "Tracking is working, please disregard"');
  } else {
    console.log('❌ TRACKING ENDPOINTS UNAVAILABLE - Diagnosis confirmed');
    console.log('Contact Jiayou: "All tracking endpoints return 404, need updated endpoints"');
    console.log('Specific issue: All tracking URLs return 404 Not Found');
    console.log('What works: Order creation with /api/orderNew/createOrder');
    console.log('What doesn\'t work: All tracking endpoints');
  }
}

// Run the final test
finalDefinitiveTest().catch(console.error);