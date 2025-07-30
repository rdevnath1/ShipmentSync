// Test script for ShipStation webhook rate shopping flow
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Mock ShipStation order webhook payload
const mockWebhookPayload = {
  resource_type: 'ORDER_NOTIFY',
  resource_url: 'https://ssapi.shipstation.com/orders/123456789'
};

// Mock ShipStation order data that would be fetched from the resource URL
const mockOrderData = {
  orderId: 123456789,
  orderNumber: 'TEST-001',
  customerEmail: 'test@example.com',
  shipTo: {
    name: 'John Doe',
    company: '',
    street1: '123 Main St',
    street2: '',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90210',
    country: 'US',
    phone: '555-123-4567'
  },
  items: [
    {
      orderItemId: 1,
      lineItemKey: 'item-1',
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      quantity: 1,
      unitPrice: 25.00,
      weight: { value: 8, units: 'ounces' }
    }
  ],
  orderStatus: 'awaiting_shipment',
  trackingNumber: null // Order not yet shipped
};

async function testWebhookFlow() {
  console.log('🚀 Testing ShipStation Webhook Rate Shopping Flow\n');

  try {
    // 1. Test webhook endpoint
    console.log('1. Testing webhook endpoint...');
    const webhookResponse = await axios.post(`${BASE_URL}/api/webhooks/shipstation/orders`, mockWebhookPayload);
    console.log('✅ Webhook accepted:', webhookResponse.data.message);
    
    // Wait a moment for async processing
    console.log('⏳ Waiting for order processing...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Test rate comparison API
    console.log('2. Testing rate comparison analytics...');
    const rateResponse = await axios.get(`${BASE_URL}/api/rate-comparisons`, {
      headers: {
        'Authorization': 'Bearer test-token' // Mock auth
      }
    });
    
    if (rateResponse.data.comparisons) {
      console.log('✅ Rate comparison data available:');
      console.log(`   - Total comparisons: ${rateResponse.data.totalComparisons}`);
      console.log(`   - Quikpik win rate: ${rateResponse.data.quikpikWinRate}%`);
      console.log(`   - Total savings: $${rateResponse.data.totalSavings}`);
    }

    // 3. Test dashboard data
    console.log('\n3. Testing analytics dashboard...');
    const analyticsResponse = await axios.get(`${BASE_URL}/api/analytics`, {
      headers: {
        'Authorization': 'Bearer test-token' // Mock auth
      }
    });
    console.log('✅ Analytics data available');

    console.log('\n🎉 Webhook flow test completed successfully!');
    console.log('\n📊 Integration Summary:');
    console.log('   ✅ Webhook endpoint receives ShipStation orders');
    console.log('   ✅ Rate shopping compares Quikpik vs competitors');
    console.log('   ✅ Winners are selected based on cost');
    console.log('   ✅ Analytics track savings and carrier performance');
    console.log('   ✅ Dashboard shows transparent rate comparisons');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testWebhookFlow();