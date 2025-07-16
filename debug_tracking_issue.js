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
    'clientId': CLIENT_ID
  };
}

async function searchTrackingNumber(trackingNumber) {
  console.log(`\n🔍 Searching for tracking number: ${trackingNumber}`);
  
  try {
    const response = await fetch(`${BASE_URL}/track`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        trackingNo: trackingNumber
      })
    });
    
    const data = await response.json();
    console.log('Raw tracking response:', JSON.stringify(data, null, 2));
    
    if (data.code === 200) {
      console.log('✅ Tracking found!');
      return data;
    } else {
      console.log('❌ Tracking not found:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error searching tracking:', error.message);
    return null;
  }
}

async function listAllOrders() {
  console.log('\n📋 Listing all orders in Jiayou system...');
  
  try {
    // Try different endpoints to find orders
    const endpoints = [
      '/orders',
      '/order/list',
      '/order/query',
      '/orders/list'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\nTrying endpoint: ${endpoint}`);
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            pageSize: 100,
            pageNumber: 1
          })
        });
        
        const data = await response.json();
        console.log(`Response from ${endpoint}:`, JSON.stringify(data, null, 2));
        
        if (data.code === 200 && data.data) {
          console.log(`✅ Found data at ${endpoint}`);
          return data;
        }
      } catch (error) {
        console.log(`❌ Error with ${endpoint}:`, error.message);
      }
    }
    
    console.log('❌ No orders found in any endpoint');
    return null;
  } catch (error) {
    console.error('❌ Error listing orders:', error.message);
    return null;
  }
}

async function searchOrderByReference(referenceNo) {
  console.log(`\n🔍 Searching for order by reference: ${referenceNo}`);
  
  try {
    const response = await fetch(`${BASE_URL}/order/query`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        referenceNo: referenceNo
      })
    });
    
    const data = await response.json();
    console.log('Order search response:', JSON.stringify(data, null, 2));
    
    if (data.code === 200) {
      console.log('✅ Order found by reference!');
      return data;
    } else {
      console.log('❌ Order not found by reference:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error searching order by reference:', error.message);
    return null;
  }
}

async function getOrderDetails(jiayouOrderId) {
  console.log(`\n📦 Getting order details for Jiayou order ID: ${jiayouOrderId}`);
  
  try {
    const response = await fetch(`${BASE_URL}/order/detail`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        orderId: jiayouOrderId
      })
    });
    
    const data = await response.json();
    console.log('Order details response:', JSON.stringify(data, null, 2));
    
    if (data.code === 200) {
      console.log('✅ Order details found!');
      return data;
    } else {
      console.log('❌ Order details not found:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting order details:', error.message);
    return null;
  }
}

async function debugTrackingIssue() {
  console.log('🚀 Starting comprehensive Jiayou tracking debug...');
  console.log('=' * 60);
  
  const trackingNumber = 'GV25USA0U019889705';
  const jiayouOrderId = '135994042';
  const referenceNo = 'REF-1752618845837-abcdefghij';
  
  console.log(`Tracking Number: ${trackingNumber}`);
  console.log(`Jiayou Order ID: ${jiayouOrderId}`);
  console.log(`Reference Number: ${referenceNo}`);
  console.log('=' * 60);
  
  // 1. Search by tracking number
  await searchTrackingNumber(trackingNumber);
  
  // 2. Search by order reference
  await searchOrderByReference(referenceNo);
  
  // 3. Get order details by Jiayou order ID
  await getOrderDetails(jiayouOrderId);
  
  // 4. List all orders to see what's in the system
  await listAllOrders();
  
  console.log('\n🏁 Debug complete!');
}

// Run the debug
debugTrackingIssue().catch(console.error);