import axios from 'axios';

const baseURL = 'http://localhost:5000';

async function testManualOrderCreation() {
  console.log('=== TESTING MANUAL ORDER CREATION PROCESS ===');
  
  try {
    // Step 1: Create a test manual order
    console.log('1. Creating test manual order...');
    const orderData = {
      orderNumber: 'TEST-DEBUG-001',
      customerName: 'Debug Test',
      customerEmail: 'debug@test.com',
      customerPhone: '555-0123',
      shippingAddress: {
        name: 'Debug Test',
        street1: '123 Test Street',
        street2: '',
        city: 'Test City',
        state: 'CA',
        postalCode: '90210',
        country: 'US',
        phone: '555-0123'
      },
      items: [{
        sku: 'DEBUG-001',
        name: 'Debug Item',
        quantity: 1,
        unitPrice: 10.00,
        weight: { value: 8, units: 'ounces' }
      }],
      totalAmount: "10.00"
    };

    const createResponse = await axios.post(`${baseURL}/api/orders/manual`, orderData);
    console.log('✓ Order created:', createResponse.data);
    
    const orderId = createResponse.data.id;
    
    // Step 2: Try to create shipment from this order
    console.log('\n2. Creating shipment from manual order...');
    const shipmentData = {
      orderId: orderId,
      weight: 8,
      dimensions: {
        length: 10,
        width: 10,
        height: 2
      }
    };

    const shipmentResponse = await axios.post(`${baseURL}/api/shipments/create`, shipmentData);
    console.log('✓ Shipment created:', shipmentResponse.data);
    
    // Step 3: Check what was actually saved in database
    console.log('\n3. Checking database record...');
    const ordersResponse = await axios.get(`${baseURL}/api/orders`);
    const createdOrder = ordersResponse.data.find(order => order.id === orderId);
    
    if (createdOrder) {
      console.log('✓ Database record found:');
      console.log('  Order ID:', createdOrder.id);
      console.log('  Order Number:', createdOrder.orderNumber);
      console.log('  Reference:', createdOrder.referenceNumber);
      console.log('  Jiayou Order ID:', createdOrder.jiayouOrderId);
      console.log('  Tracking Number:', createdOrder.trackingNumber);
      console.log('  Status:', createdOrder.status);
      console.log('  Label Path:', createdOrder.labelPath);
      
      // Step 4: Test if we can find this order in Jiayou
      if (createdOrder.trackingNumber) {
        console.log('\n4. Testing Jiayou tracking lookup...');
        try {
          const trackingResponse = await axios.get(`${baseURL}/api/tracking/${createdOrder.trackingNumber}`);
          console.log('✓ Tracking lookup result:', trackingResponse.data);
        } catch (error) {
          console.log('✗ Tracking lookup failed:', error.response?.data?.error || error.message);
        }
      }
    } else {
      console.log('✗ Created order not found in database');
    }
    
  } catch (error) {
    console.error('Error in test:', error.response?.data?.error || error.message);
    console.error('Full error:', error.response?.data || error.message);
  }
}

// Run the test
testManualOrderCreation();