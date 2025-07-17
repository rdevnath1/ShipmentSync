const { LabelProcessor } = require('./server/services/labelProcessor');
const fs = require('fs');

async function createExampleLabel() {
  console.log('Creating example label with your logo...');
  
  const labelProcessor = new LabelProcessor();
  
  // Use the existing label from Order ID 3 that has a valid labelPath
  const existingLabelUrl = 'http://oss.jiayouexp.com/document/order-label/pdf/20250717/GV25USA0U019866484.pdf';
  const trackingNumber = 'GV25USA0U019866484';
  
  try {
    console.log('Processing existing label with logo...');
    const processedPath = await labelProcessor.processAndSaveLabel(existingLabelUrl, trackingNumber);
    
    console.log('✅ Label processed successfully!');
    console.log('📁 File location:', processedPath);
    
    // Check file size to confirm it was created
    const stats = fs.statSync(processedPath);
    console.log('📊 File size:', Math.round(stats.size / 1024), 'KB');
    
    // Generate the public URL
    const publicUrl = `http://localhost:5000${labelProcessor.generateLabelUrl(trackingNumber)}`;
    console.log('🔗 Public URL:', publicUrl);
    
    console.log('\n🎯 What the logo processing does:');
    console.log('- Downloads original Jiayou PDF label');
    console.log('- Adds your company logo to top-right corner');
    console.log('- Adds "Powered by Your Company" branding');
    console.log('- Saves processed label locally');
    console.log('- Provides URL for ShipStation integration');
    
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Error processing label:', error.message);
    return null;
  }
}

// Run the example
createExampleLabel().then(url => {
  if (url) {
    console.log('\n🚀 Example complete! Access your branded label at:', url);
  }
}).catch(console.error);