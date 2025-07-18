import crypto from 'crypto';

// Test both sets of credentials
const API_KEY = 'd370d0ee7e704117bfca9184bc03f590';
const CLIENT_ID = '769908';

// Let's also try the exact authentication method from the working order creation
function generateSignature(code, apiKey) {
  return crypto.createHash('md5').update(code + apiKey).digest('hex');
}

// Test the original working authentication from when we successfully created orders
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

// Test the new method we just implemented
function getNewAuthHeaders() {
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

async function testOrderCreationWithBothMethods() {
  console.log('🧪 Testing order creation with both authentication methods...');
  
  const testOrder = {
    channelCode: "US001",
    referenceNo: "VERIFY-TEST-" + Date.now(),
    productType: 1,
    pweight: 0.227,
    pieces: 1,
    insured: 0,
    consigneeName: "Test User",
    consigneeCountryCode: "US",
    consigneeProvince: "NY",
    consigneeCity: "New York",
    consigneeAddress: "123 Test St",
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

  const testEndpoints = [
    { url: 'https://api.jygjexp.com/v1/order/create', name: 'V1 Order Create' },
    { url: 'https://api.jygjexp.com/v1/api/orderNew/createOrder', name: 'V1 OrderNew Create' },
    { url: 'https://api.jygjexp.com/v1/api/orderNew/createOrder', name: 'V1 OrderNew Create (Working Auth)' }
  ];

  for (let i = 0; i < testEndpoints.length; i++) {
    const endpoint = testEndpoints[i];
    console.log(`\n${i + 1}. Testing ${endpoint.name}...`);
    
    try {
      const headers = i === 2 ? getWorkingAuthHeaders() : getNewAuthHeaders();
      console.log('   Headers:', JSON.stringify(headers, null, 2));
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(testOrder)
      });
      
      const data = await response.json();
      console.log('   Response:', JSON.stringify(data, null, 2));
      
      if (data.code === 200 || data.code === 1) {
        console.log(`   ✅ SUCCESS: ${endpoint.name} works!`);
        console.log(`   📝 Order ID: ${data.data?.orderId}`);
        console.log(`   📦 Tracking: ${data.data?.trackingNo}`);
        return { success: true, endpoint: endpoint.name, data: data.data };
      } else {
        console.log(`   ❌ FAILED: ${data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }
  
  return { success: false };
}

async function checkOriginalTrackingNumber() {
  console.log('\n🔍 Checking if original tracking number exists in our database...');
  
  // Check what we have in our local database
  try {
    const response = await fetch('http://localhost:5000/api/orders');
    const orders = await response.json();
    
    console.log('Orders in database:');
    orders.forEach(order => {
      console.log(`  Order ${order.id}: ${order.trackingNumber || 'NO TRACKING'} (Status: ${order.status})`);
      if (order.trackingNumber === 'GV25USA0U019889705') {
        console.log(`  ✅ Found target tracking number in order ${order.id}`);
        console.log(`  📋 Reference: ${order.referenceNumber}`);
        console.log(`  🏢 Jiayou Order ID: ${order.jiayouOrderId}`);
      }
    });
  } catch (error) {
    console.log('❌ Could not check local database:', error.message);
  }
}

async function testExistingWorkingEndpoint() {
  console.log('\n🔄 Testing the endpoint that we know worked before...');
  
  try {
    const response = await fetch('https://api.jygjexp.com/v1/api/orderNew/createOrder', {
      method: 'POST',
      headers: getWorkingAuthHeaders(),
      body: JSON.stringify({ test: 'connectivity' })
    });
    
    const data = await response.json();
    console.log('Previous working endpoint response:', JSON.stringify(data, null, 2));
    
    if (data.code !== 0 || !data.message.includes('accesskey')) {
      console.log('✅ The old endpoint still works - API key is valid!');
      return true;
    } else {
      console.log('❌ The old endpoint also fails - API key issue is real');
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing old endpoint:', error.message);
    return false;
  }
}

async function verifyRealIssue() {
  console.log('🔍 VERIFYING THE REAL ISSUE WITH JIAYOU TRACKING');
  console.log('=' * 55);
  
  console.log('\n📋 HYPOTHESIS: API key authentication is failing');
  console.log('🎯 TARGET: Verify if tracking number GV25USA0U019889705 exists');
  
  // Step 1: Check our local database
  await checkOriginalTrackingNumber();
  
  // Step 2: Test if we can still create orders (proves API key works)
  const orderTest = await testOrderCreationWithBothMethods();
  
  // Step 3: Test the old working endpoint
  const oldEndpointWorks = await testExistingWorkingEndpoint();
  
  console.log('\n📊 VERIFICATION RESULTS:');
  console.log('=' * 30);
  
  if (orderTest.success) {
    console.log('✅ NEW ORDER CREATION: SUCCESS');
    console.log('   → API key is valid and working');
    console.log('   → Authentication method is correct');
    console.log('   → Issue is likely with tracking endpoints, not API key');
  } else {
    console.log('❌ NEW ORDER CREATION: FAILED');
    console.log('   → API key might be invalid');
    console.log('   → Authentication method might be wrong');
  }
  
  if (oldEndpointWorks) {
    console.log('✅ OLD ENDPOINT: STILL WORKS');
    console.log('   → API key is definitely valid');
  } else {
    console.log('❌ OLD ENDPOINT: ALSO FAILS');
    console.log('   → API key issue is confirmed');
  }
  
  console.log('\n🎯 CONCLUSION:');
  if (orderTest.success || oldEndpointWorks) {
    console.log('The API key works fine for order creation.');
    console.log('The tracking issue is likely due to:');
    console.log('1. Tracking endpoints being different/deprecated');
    console.log('2. Tracking requiring different authentication');
    console.log('3. Tracking number may not exist in Jiayou system');
    console.log('4. Time delay before tracking becomes available');
  } else {
    console.log('The API key authentication is genuinely failing.');
    console.log('This confirms the original diagnosis was correct.');
  }
}

// Run the verification
verifyRealIssue().catch(console.error);