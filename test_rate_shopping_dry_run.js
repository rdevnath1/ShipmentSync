#!/usr/bin/env node

/**
 * Dry Run Test for Rate Shopping Flow
 * Tests the ShipStation webhook → rate comparison → carrier selection flow
 */

import axios from 'axios';

const SERVER_URL = 'http://localhost:3002';

// Sample ShipStation order data (based on their webhook payload format)
const SAMPLE_ORDER_DATA = {
  orderId: 123456789,
  orderNumber: "TEST-12345",
  orderKey: "test-order-key-abc123",
  customerUsername: "testuser",
  customerEmail: "test@customer.com",
  shipTo: {
    name: "John Doe",
    company: "Test Company",
    street1: "123 Test Street",
    street2: "Suite 100",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90210",
    country: "US",
    phone: "555-123-4567"
  },
  billTo: {
    name: "John Doe",
    company: "Test Company", 
    street1: "123 Test Street",
    street2: "Suite 100",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90210",
    country: "US",
    phone: "555-123-4567"
  },
  items: [
    {
      orderItemId: 1,
      lineItemKey: "item-key-1",
      sku: "TEST-SKU-001",
      name: "Test Product 1",
      quantity: 2,
      unitPrice: 25.99,
      weight: {
        value: 8,
        units: "ounces"
      }
    },
    {
      orderItemId: 2,
      lineItemKey: "item-key-2", 
      sku: "TEST-SKU-002",
      name: "Test Product 2",
      quantity: 1,
      unitPrice: 15.50,
      weight: {
        value: 4,
        units: "ounces"
      }
    }
  ],
  orderTotal: 67.48,
  amountPaid: 67.48,
  orderStatus: "awaiting_shipment",
  orderDate: "2025-07-30T01:00:00.000Z",
  shipDate: null,
  carrierCode: null,
  serviceCode: null,
  packageCode: null,
  confirmation: null,
  shipmentId: null,
  trackingNumber: null
};

// Sample ShipStation webhook payload
const WEBHOOK_PAYLOAD = {
  resource_url: `https://ssapi.shipstation.com/orders/${SAMPLE_ORDER_DATA.orderId}`,
  resource_type: "ORDER_NOTIFY"
};

async function testRateShoppingDryRun() {
  console.log('🧪 Starting Rate Shopping Dry Run Test\n');
  
  try {
    // Step 1: Check server health
    console.log('1️⃣ Checking server health...');
    const healthResponse = await axios.get(`${SERVER_URL}/api/health`);
    console.log('✅ Server is healthy:', healthResponse.data);
    console.log();

    // Step 2: Test webhook endpoint directly
    console.log('2️⃣ Testing ShipStation webhook endpoint...');
    const webhookResponse = await axios.post(
      `${SERVER_URL}/api/webhooks/shipstation/orders`,
      WEBHOOK_PAYLOAD,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true' // Flag to indicate this is a test
        }
      }
    );
    console.log('✅ Webhook accepted:', webhookResponse.data);
    console.log();

    // Step 3: Test rate comparison service directly
    console.log('3️⃣ Testing rate comparison logic...');
    
    // Mock the rate comparison API call (if you have a direct endpoint)
    try {
      const rateResponse = await axios.post(
        `${SERVER_URL}/api/test/rate-comparison`,
        {
          orderData: SAMPLE_ORDER_DATA
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Rate comparison results:', JSON.stringify(rateResponse.data, null, 2));
    } catch (error) {
      console.log('ℹ️ Direct rate comparison endpoint not available, testing via webhook flow');
    }
    console.log();

    // Step 4: Wait and check for order processing results
    console.log('4️⃣ Waiting for async order processing...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
    
    // Check if order was created in local database
    try {
      const ordersResponse = await axios.get(`${SERVER_URL}/api/orders`);
      const testOrder = ordersResponse.data.orders?.find(
        order => order.orderNumber === SAMPLE_ORDER_DATA.orderNumber
      );
      
      if (testOrder) {
        console.log('✅ Order processed and stored:', {
          orderNumber: testOrder.orderNumber,
          carrier: testOrder.carrier,
          cost: testOrder.cost,
          status: testOrder.status,
          trackingNumber: testOrder.trackingNumber
        });
      } else {
        console.log('⚠️ Test order not found in database - check processing logs');
      }
    } catch (error) {
      console.log('⚠️ Could not verify order storage:', error.message);
    }
    console.log();

    // Step 5: Check rate comparison analytics
    console.log('5️⃣ Checking rate comparison analytics...');
    try {
      const analyticsResponse = await axios.get(`${SERVER_URL}/api/rate-comparisons/recent`);
      console.log('✅ Recent rate comparisons:', analyticsResponse.data);
    } catch (error) {
      console.log('ℹ️ Rate comparison analytics not available:', error.message);
    }
    console.log();

    console.log('🎉 Dry run test completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- Webhook endpoint: ✅ Working');
    console.log('- Order processing: ✅ Triggered');
    console.log('- Rate comparison: 🔄 Check logs for details');
    console.log('- Carrier selection: 🔄 Check logs for winner');
    console.log('\n💡 Check server logs for detailed rate shopping flow execution');

  } catch (error) {
    console.error('❌ Dry run test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Helper function to test with different order scenarios
async function testMultipleScenarios() {
  console.log('🔄 Testing multiple order scenarios...\n');
  
  const scenarios = [
    {
      name: "Light Package (CA to CA)",
      modifications: {
        shipTo: { ...SAMPLE_ORDER_DATA.shipTo, postalCode: "90210" },
        items: [{ ...SAMPLE_ORDER_DATA.items[0], weight: { value: 4, units: "ounces" } }]
      }
    },
    {
      name: "Heavy Package (CA to NY)", 
      modifications: {
        shipTo: { ...SAMPLE_ORDER_DATA.shipTo, postalCode: "10001", state: "NY", city: "New York" },
        items: [
          { ...SAMPLE_ORDER_DATA.items[0], weight: { value: 32, units: "ounces" }, quantity: 3 }
        ]
      }
    },
    {
      name: "Cross-country (CA to FL)",
      modifications: {
        shipTo: { ...SAMPLE_ORDER_DATA.shipTo, postalCode: "33101", state: "FL", city: "Miami" }
      }
    }
  ];

  for (const scenario of scenarios) {
    console.log(`🧪 Testing: ${scenario.name}`);
    const testOrder = { ...SAMPLE_ORDER_DATA, ...scenario.modifications };
    testOrder.orderNumber = `TEST-${Date.now()}`;
    
    try {
      const response = await axios.post(
        `${SERVER_URL}/api/webhooks/shipstation/orders`,
        {
          resource_url: `https://ssapi.shipstation.com/orders/${testOrder.orderId}`,
          resource_type: "ORDER_NOTIFY"
        }
      );
      console.log(`✅ ${scenario.name} webhook sent`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    } catch (error) {
      console.log(`❌ ${scenario.name} failed:`, error.message);
    }
  }
  
  console.log('\n⏳ Wait 5 seconds then check /api/orders and server logs for results');
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--scenarios')) {
    await testMultipleScenarios();
  } else {
    await testRateShoppingDryRun();
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}