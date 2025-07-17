// Simple test to demonstrate logo processing
const axios = require('axios');
const fs = require('fs');

async function createDemoLabel() {
  console.log('Creating demo label with logo processing...');
  
  try {
    // Create a shipment using the API
    const response = await axios.post('http://localhost:5000/api/shipments', {
      orderId: 2,
      weight: 8,
      dimensions: {
        length: 10,
        width: 8,
        height: 4
      }
    });
    
    console.log('Shipment created successfully!');
    console.log('Response:', response.data);
    
    // Check if processed label exists
    const labelPath = `labels/${response.data.trackingNumber}_with_logo.pdf`;
    
    if (fs.existsSync(labelPath)) {
      console.log('✅ Processed label created:', labelPath);
      console.log('✅ Label URL:', `http://localhost:5000/api/labels/${response.data.trackingNumber}_with_logo.pdf`);
    } else {
      console.log('❌ Processed label not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

createDemoLabel();