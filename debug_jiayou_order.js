import axios from 'axios';
import crypto from 'crypto';

// Your Jiayou credentials
const API_KEY = 'd370d0ee7e704117bfca9184bc03f590';
const CLIENT_ID = '769908';
const BASE_URL = 'https://api.jygjexp.com/v1';

// Generate signature for authentication
function generateSignature(code, apiKey) {
  return crypto.createHash('md5').update(code + apiKey).digest('hex');
}

// Get auth headers
function getAuthHeaders() {
  const code = CLIENT_ID;
  const signature = generateSignature(code, API_KEY);
  
  return {
    'Content-Type': 'application/json',
    'code': code,
    'signature': signature
  };
}

async function searchOrderInJiayou() {
  const manualOrderData = {
    jiayouOrderId: '135970099',
    trackingNumber: 'GV25USA0U019866484',
    labelUrl: 'http://oss.jiayouexp.com/document/order-label/pdf/20250717/GV25USA0U019866484.pdf'
  };

  console.log('=== DEBUGGING JIAYOU ORDER SEARCH ===');
  console.log('Manual Order Data:', manualOrderData);
  console.log('');

  try {
    // Method 1: Search by order ID (if such endpoint exists)
    console.log('1. Attempting to search by order ID...');
    try {
      const orderResponse = await axios.post(
        `${BASE_URL}/api/orderNew/getOrderInfo`,
        { orderId: manualOrderData.jiayouOrderId },
        { headers: getAuthHeaders() }
      );
      console.log('✓ Found order by ID:', orderResponse.data);
    } catch (error) {
      console.log('✗ Order ID search failed:', error.response?.data?.message || error.message);
    }

    // Method 2: Search by tracking number
    console.log('');
    console.log('2. Attempting to search by tracking number...');
    try {
      const trackingResponse = await axios.post(
        `${BASE_URL}/api/orderNew/getOrderTrack`,
        { trackingNo: manualOrderData.trackingNumber },
        { headers: getAuthHeaders() }
      );
      console.log('✓ Found order by tracking:', trackingResponse.data);
    } catch (error) {
      console.log('✗ Tracking search failed:', error.response?.data?.message || error.message);
    }

    // Method 3: List recent orders
    console.log('');
    console.log('3. Attempting to list recent orders...');
    try {
      const listResponse = await axios.post(
        `${BASE_URL}/api/orderNew/getOrderList`,
        { 
          pageSize: 50,
          pageNo: 1,
          startTime: '2025-07-16',
          endTime: '2025-07-17'
        },
        { headers: getAuthHeaders() }
      );
      console.log('✓ Recent orders found:', listResponse.data);
      
      // Look for our order in the list
      if (listResponse.data.data && listResponse.data.data.list) {
        const ourOrder = listResponse.data.data.list.find(order => 
          order.orderId === manualOrderData.jiayouOrderId || 
          order.trackingNo === manualOrderData.trackingNumber
        );
        
        if (ourOrder) {
          console.log('🎯 FOUND OUR MANUAL ORDER IN LIST:');
          console.log('Reference Number:', ourOrder.referenceNo);
          console.log('Order ID:', ourOrder.orderId);
          console.log('Tracking:', ourOrder.trackingNo);
          console.log('Status:', ourOrder.status);
          console.log('Full order data:', JSON.stringify(ourOrder, null, 2));
        } else {
          console.log('❌ Our order not found in recent orders list');
        }
      }
    } catch (error) {
      console.log('✗ Order list failed:', error.response?.data?.message || error.message);
    }

    // Method 4: Test label URL accessibility
    console.log('');
    console.log('4. Testing label URL accessibility...');
    try {
      const labelResponse = await axios.head(manualOrderData.labelUrl);
      console.log('✓ Label URL accessible:', labelResponse.status, labelResponse.headers['content-type']);
    } catch (error) {
      console.log('✗ Label URL not accessible:', error.message);
    }

    console.log('');
    console.log('=== SEARCH RECOMMENDATIONS ===');
    console.log('In your Jiayou dashboard, try searching for:');
    console.log('- Order ID: 135970099');
    console.log('- Tracking: GV25USA0U019866484');
    console.log('- Reference pattern: O1-1752687197553-[random]');
    console.log('- Date range: 2025-07-16 to 2025-07-17');
    console.log('- Channel: US001');

  } catch (error) {
    console.error('Overall error:', error.message);
  }
}

// Run the search
searchOrderInJiayou();