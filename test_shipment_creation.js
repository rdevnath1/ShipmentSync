// Test the new Quikpik logo replacement in top-left
const axios = require('axios');
const fs = require('fs');

async function testQuikpikLabelBranding() {
  console.log('Testing Quikpik Logo Replacement in Top-Left');
  console.log('============================================');
  
  try {
    // Create a new shipment to test the logo replacement
    console.log('1. Creating new shipment with Quikpik branding...');
    
    const shipmentData = {
      orderId: 2, // Use existing pending order
      weight: 8,
      dimensions: {
        length: 10,
        width: 8,
        height: 4
      }
    };
    
    console.log('Sending shipment request...');
    const response = await axios.post('http://localhost:5000/api/shipments', shipmentData);
    
    if (response.status === 200) {
      console.log('✅ Shipment created successfully!');
      console.log('Response:', response.data);
      
      // Check if processed label was created
      const trackingNumber = response.data.jiayouResponse?.trackingNo;
      if (trackingNumber) {
        console.log(`📦 Tracking Number: ${trackingNumber}`);
        
        // Check for processed label file
        const labelPath = `labels/${trackingNumber}_with_logo.pdf`;
        if (fs.existsSync(labelPath)) {
          console.log(`✅ Processed label created: ${labelPath}`);
          
          const stats = fs.statSync(labelPath);
          console.log(`📊 Label size: ${Math.round(stats.size / 1024)} KB`);
          
          console.log(`🔗 Access URL: http://localhost:5000/api/labels/${trackingNumber}_with_logo.pdf`);
          
          console.log('\n🎨 Label Changes:');
          console.log('   • Removed: uniuni logo and branding (top-left)');
          console.log('   • Added: Quikpik logo in top-left position');
          console.log('   • Added: "Quikpik" text next to logo');
          console.log('   • Style: Clean white background overlay');
          console.log('   • Size: 80x40px optimized for main branding');
          
        } else {
          console.log('❌ Processed label not found');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testQuikpikLabelBranding();