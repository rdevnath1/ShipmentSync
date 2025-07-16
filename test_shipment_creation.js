// Test script to verify ChatGPT's fixes are working
import fetch from 'node-fetch';

async function testShipmentCreation() {
  console.log('🚀 Testing shipment creation with ChatGPT fixes...');
  
  // Test with a working postal code
  const testShipmentData = {
    orderId: 4, // Use existing order ID
    weight: 8,  // 8 oz
    dimensions: {
      length: 12,
      width: 8,
      height: 2
    }
  };
  
  try {
    console.log('Sending shipment creation request...');
    const response = await fetch('http://localhost:5000/api/shipments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testShipmentData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Shipment created successfully!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Shipment creation failed');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n📊 Check the server console for:');
  console.log('- "→ Jiayou createOrder" log entry');
  console.log('- "→ Jiayou auth headers" log entry');
  console.log('- "→ Jiayou response" log entry');
  console.log('- Either "✅ Jiayou succeeded" or "❌ Jiayou failed"');
}

testShipmentCreation().catch(console.error);