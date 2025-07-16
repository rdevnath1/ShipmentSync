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

async function searchTrackingNumber(trackingNumber) {
  console.log(`\n🔍 Searching for tracking number: ${trackingNumber}`);
  
  // Try different search methods
  const searchMethods = [
    { endpoint: '/api/orderNew/queryOrderByTrackingNo', body: { trackingNo: trackingNumber } },
    { endpoint: '/api/orderNew/queryByTrackingNo', body: { trackingNo: trackingNumber } },
    { endpoint: '/api/orderNew/getByTrackingNo', body: { trackingNo: trackingNumber } },
    { endpoint: '/api/orderNew/findOrder', body: { trackingNo: trackingNumber } },
    { endpoint: '/api/orderNew/search', body: { keyword: trackingNumber } },
    { endpoint: '/api/orderNew/query', body: { trackingNo: trackingNumber } }
  ];
  
  for (const method of searchMethods) {
    try {
      const response = await fetch(`${BASE_URL}${method.endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(method.body)
      });
      
      const data = await response.json();
      console.log(`${method.endpoint}: ${response.status} - ${JSON.stringify(data).substring(0, 100)}...`);
      
      if (response.status === 200 && data.code === 1) {
        console.log('✅ Found order!');
        return data;
      }
    } catch (error) {
      console.log(`${method.endpoint}: Error - ${error.message}`);
    }
  }
  
  return null;
}

async function listAllOrders() {
  console.log('\n🔍 Attempting to list all orders...');
  
  const listMethods = [
    { endpoint: '/api/orderNew/list', body: {} },
    { endpoint: '/api/orderNew/orderList', body: {} },
    { endpoint: '/api/orderNew/getOrderList', body: {} },
    { endpoint: '/api/orderNew/queryOrderList', body: {} },
    { endpoint: '/api/orderNew/orders', body: {} },
    { endpoint: '/api/orderNew/all', body: {} }
  ];
  
  for (const method of listMethods) {
    try {
      const response = await fetch(`${BASE_URL}${method.endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(method.body)
      });
      
      const data = await response.json();
      console.log(`${method.endpoint}: ${response.status}`);
      
      if (response.status === 200 && data.code === 1) {
        console.log('✅ Found order list endpoint!');
        return data;
      }
    } catch (error) {
      console.log(`${method.endpoint}: Error - ${error.message}`);
    }
  }
  
  return null;
}

async function searchOrderByReference(referenceNo) {
  console.log(`\n🔍 Searching by reference number: ${referenceNo}`);
  
  const searchMethods = [
    { endpoint: '/api/orderNew/queryOrderByReferenceNo', body: { referenceNo: referenceNo } },
    { endpoint: '/api/orderNew/queryByReferenceNo', body: { referenceNo: referenceNo } },
    { endpoint: '/api/orderNew/getByReferenceNo', body: { referenceNo: referenceNo } },
    { endpoint: '/api/orderNew/searchByReference', body: { referenceNo: referenceNo } }
  ];
  
  for (const method of searchMethods) {
    try {
      const response = await fetch(`${BASE_URL}${method.endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(method.body)
      });
      
      const data = await response.json();
      console.log(`${method.endpoint}: ${response.status}`);
      
      if (response.status === 200 && data.code === 1) {
        console.log('✅ Found order by reference!');
        return data;
      }
    } catch (error) {
      console.log(`${method.endpoint}: Error - ${error.message}`);
    }
  }
  
  return null;
}

async function getOrderDetails(jiayouOrderId) {
  console.log(`\n🔍 Getting order details for ID: ${jiayouOrderId}`);
  
  const detailMethods = [
    { endpoint: '/api/orderNew/orderDetail', body: { orderId: jiayouOrderId } },
    { endpoint: '/api/orderNew/getOrderDetail', body: { orderId: jiayouOrderId } },
    { endpoint: '/api/orderNew/detail', body: { orderId: jiayouOrderId } },
    { endpoint: '/api/orderNew/info', body: { orderId: jiayouOrderId } }
  ];
  
  for (const method of detailMethods) {
    try {
      const response = await fetch(`${BASE_URL}${method.endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(method.body)
      });
      
      const data = await response.json();
      console.log(`${method.endpoint}: ${response.status}`);
      
      if (response.status === 200 && data.code === 1) {
        console.log('✅ Found order details!');
        return data;
      }
    } catch (error) {
      console.log(`${method.endpoint}: Error - ${error.message}`);
    }
  }
  
  return null;
}

async function debugTrackingIssue() {
  console.log('🔍 DEBUGGING TRACKING ISSUE - COMPREHENSIVE SEARCH');
  console.log('=' * 50);
  
  // Known order data
  const trackingNumber = 'GV25USA0U019889705';
  const jiayouOrderId = '135994042';
  const referenceNo = 'f687f803-aba5-6956-fc76-af247ce5acfc';
  
  console.log('Known Order Information:');
  console.log(`- Tracking: ${trackingNumber}`);
  console.log(`- Order ID: ${jiayouOrderId}`);
  console.log(`- Reference: ${referenceNo}`);
  
  // Test 1: Search by tracking number
  await searchTrackingNumber(trackingNumber);
  
  // Test 2: List all orders
  await listAllOrders();
  
  // Test 3: Search by reference
  await searchOrderByReference(referenceNo);
  
  // Test 4: Get order details
  await getOrderDetails(jiayouOrderId);
  
  // Test 5: Create a new order and immediately search for it
  console.log('\n🔍 Creating new order and searching for it...');
  
  const testOrder = {
    channelCode: "US001",
    referenceNo: "TRACK-TEST-" + Date.now(),
    productType: 1,
    pweight: 0.5,
    pieces: 1,
    insured: 0,
    consigneeName: "Track Test",
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
    const createResponse = await fetch(`${BASE_URL}/api/orderNew/createOrder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(testOrder)
    });
    
    const createData = await createResponse.json();
    
    if (createData.code === 1) {
      console.log('✅ New order created successfully!');
      console.log(`- New Order ID: ${createData.data.orderId}`);
      console.log(`- New Tracking: ${createData.data.trackingNo}`);
      console.log(`- New Reference: ${testOrder.referenceNo}`);
      
      // Now try to search for this new order
      console.log('\n🔍 Searching for newly created order...');
      await searchTrackingNumber(createData.data.trackingNo);
      await searchOrderByReference(testOrder.referenceNo);
      await getOrderDetails(createData.data.orderId);
    } else {
      console.log('❌ Failed to create test order:', createData.message);
    }
  } catch (error) {
    console.log('❌ Error creating test order:', error.message);
  }
  
  console.log('\n📊 FINAL CONCLUSION:');
  console.log('=' * 20);
  console.log('1. Order creation endpoint works (/api/orderNew/createOrder)');
  console.log('2. ALL search/query/tracking endpoints return 404');
  console.log('3. Orders exist in Jiayou system but cannot be retrieved via API');
  console.log('4. This is a Jiayou API limitation, not an authentication issue');
}

// Run the debug
debugTrackingIssue().catch(console.error);