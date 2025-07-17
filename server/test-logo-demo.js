const { LabelProcessor } = require('./services/labelProcessor');
const fs = require('fs');

async function demonstrateLogoProcessing() {
  console.log('DEMO: Logo Processing for Jiayou Shipping Labels');
  console.log('===============================================');
  
  const labelProcessor = new LabelProcessor();
  
  // Use existing label from your Order ID 3
  const labelUrl = 'http://oss.jiayouexp.com/document/order-label/pdf/20250717/GV25USA0U019866484.pdf';
  const trackingNumber = 'DEMO_' + Date.now();
  
  try {
    console.log('1. Downloading original Jiayou label...');
    console.log('   From:', labelUrl);
    
    console.log('2. Processing with your logo...');
    console.log('   Logo file: attached_assets/logo_1752442395960.png');
    
    const processedPath = await labelProcessor.processAndSaveLabel(labelUrl, trackingNumber);
    
    console.log('3. SUCCESS! Label processed with logo');
    console.log('   Saved to:', processedPath);
    
    const stats = fs.statSync(processedPath);
    console.log('   File size:', Math.round(stats.size / 1024), 'KB');
    
    const publicUrl = labelProcessor.generateLabelUrl(trackingNumber);
    console.log('   Access URL: http://localhost:5000' + publicUrl);
    
    console.log('\nLogo Processing Features:');
    console.log('✓ Adds company logo (60x60px, top-right corner)');
    console.log('✓ Transparent background for clean appearance');
    console.log('✓ Subtle branding text below logo');
    console.log('✓ Preserves all original shipping information');
    console.log('✓ Automatic fallback to original if processing fails');
    
    console.log('\nIntegration Workflow:');
    console.log('Order → Jiayou Label → Logo Processing → ShipStation');
    
    return publicUrl;
    
  } catch (error) {
    console.error('Demo error:', error.message);
    console.log('\nThe system is designed with robust error handling:');
    console.log('- Falls back to original label if processing fails');
    console.log('- Continues shipment creation process');
    console.log('- Logs errors for debugging');
    return null;
  }
}

// Run demo
demonstrateLogoProcessing().then(url => {
  if (url) {
    console.log('\n🎯 DEMO COMPLETE!');
    console.log('Your branded label is ready at: http://localhost:5000' + url);
    console.log('\nNext: Create a new shipment to see automatic logo processing!');
  }
}).catch(console.error);