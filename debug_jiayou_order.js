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

async function searchOrderInJiayou() {
  console.log('🔍 INVESTIGATING WHY ORDER DOESN\'T SHOW IN JIAYOU BACKEND');
  console.log('=' * 55);
  
  const trackingNumber = 'GV25USA0U019889705';
  const jiayouOrderId = '135994042';
  const referenceNo = 'f687f803-aba5-6956-fc76-af247ce5acfc';
  
  console.log('Target Order Details:');
  console.log(`- Tracking Number: ${trackingNumber}`);
  console.log(`- Jiayou Order ID: ${jiayouOrderId}`);
  console.log(`- Reference Number: ${referenceNo}`);
  
  // Test 1: Try to search by all possible methods
  console.log('\n🔍 TEST 1: Search order by different methods');
  
  const searchMethods = [
    {
      name: 'Search by tracking number',
      endpoint: '/api/orderNew/searchOrder',
      body: { trackingNo: trackingNumber }
    },
    {
      name: 'Search by order ID',
      endpoint: '/api/orderNew/searchOrder',
      body: { orderId: jiayouOrderId }
    },
    {
      name: 'Search by reference number',
      endpoint: '/api/orderNew/searchOrder',
      body: { referenceNo: referenceNo }
    },
    {
      name: 'Get order details',
      endpoint: '/api/orderNew/getOrder',
      body: { orderId: jiayouOrderId }
    },
    {
      name: 'List all orders',
      endpoint: '/api/orderNew/listOrders',
      body: {}
    },
    {
      name: 'Query order status',
      endpoint: '/api/orderNew/queryOrderStatus',
      body: { orderId: jiayouOrderId }
    }
  ];
  
  let foundOrder = false;
  
  for (const method of searchMethods) {
    try {
      console.log(`\nTesting: ${method.name}`);
      console.log(`URL: ${BASE_URL}${method.endpoint}`);
      
      const response = await fetch(`${BASE_URL}${method.endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(method.body)
      });
      
      const data = await response.json();
      console.log(`Response: ${JSON.stringify(data, null, 2)}`);
      
      if (response.status === 200 && data.code === 1) {
        console.log('✅ SUCCESS: Found order in Jiayou system!');
        foundOrder = true;
        break;
      } else if (response.status === 200 && data.code === 0) {
        console.log('⚠️  API responded but no order found');
      } else if (response.status === 404) {
        console.log('❌ Endpoint does not exist');
      } else {
        console.log(`❌ Failed with status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Test 2: Check if order creation actually worked
  console.log('\n🔍 TEST 2: Verify recent order creation worked');
  
  try {
    const recentOrder = {
      channelCode: "US001",
      referenceNo: "DEBUG-ORDER-" + Date.now(),
      productType: 1,
      pweight: 0.227,
      pieces: 1,
      insured: 0,
      consigneeName: "Debug User",
      consigneeCountryCode: "US",
      consigneeProvince: "CA",
      consigneeCity: "San Francisco",
      consigneeAddress: "123 Debug St",
      consigneePostcode: "94102",
      consigneePhone: "4151234567",
      shipperName: "Debug Shipper",
      shipperCountryCode: "CN",
      shipperProvince: "Beijing",
      shipperCity: "Beijing",
      shipperAddress: "Debug Address",
      shipperPostcode: "100000",
      shipperPhone: "1234567890",
      apiOrderItemList: [{
        ename: "Debug Item",
        sku: "DEBUG-001",
        price: 15.00,
        quantity: 1,
        weight: 0.227,
        unitCode: "PCS"
      }],
      fromAddressId: "JFK"
    };
    
    const response = await fetch(`${BASE_URL}/api/orderNew/createOrder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(recentOrder)
    });
    
    const data = await response.json();
    console.log('New order creation test:', JSON.stringify(data, null, 2));
    
    if (data.code === 1) {
      console.log('✅ Order creation still works - API integration is functional');
      console.log(`New order ID: ${data.data.orderId}`);
      console.log(`New tracking: ${data.data.trackingNo}`);
      
      // Now try to immediately search for this new order
      console.log('\n🔍 TEST 3: Search for just-created order');
      
      try {
        const searchResponse = await fetch(`${BASE_URL}/api/orderNew/searchOrder`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ orderId: data.data.orderId })
        });
        
        const searchData = await searchResponse.json();
        console.log('Search for new order:', JSON.stringify(searchData, null, 2));
        
        if (searchData.code === 1) {
          console.log('✅ New order is immediately searchable - search endpoints work');
        } else {
          console.log('❌ New order is NOT searchable - search endpoints may not work');
        }
      } catch (error) {
        console.log('❌ Error searching for new order:', error.message);
      }
    } else {
      console.log('❌ Order creation failed - API may have issues');
    }
  } catch (error) {
    console.log('❌ Error creating test order:', error.message);
  }
  
  console.log('\n🎯 CONCLUSION:');
  console.log('=' * 15);
  
  if (foundOrder) {
    console.log('✅ Original order EXISTS in Jiayou system');
    console.log('   → Only tracking endpoints are the problem');
  } else {
    console.log('❌ Original order NOT FOUND in Jiayou system');
    console.log('   → This suggests:');
    console.log('     1. Order creation may have failed silently');
    console.log('     2. Order search endpoints are also broken');
    console.log('     3. There may be a database sync issue');
    console.log('     4. The order ID/tracking number may be incorrect');
  }
}

// Run the investigation
searchOrderInJiayou().catch(console.error);