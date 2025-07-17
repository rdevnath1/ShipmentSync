// Test the label processing functionality
const { LabelProcessor } = require('./server/services/labelProcessor.ts');
const fs = require('fs');
const path = require('path');

async function testLabelProcessing() {
  console.log('Testing label processing with logo...');
  
  const labelProcessor = new LabelProcessor();
  
  // Use an existing label URL from our orders
  const testLabelUrl = 'http://oss.jiayouexp.com/document/order-label/pdf/20250717/GV25USA0U019866484.pdf';
  const testTrackingNumber = 'GV25USA0U019866484';
  
  try {
    // Process the label
    const processedPath = await labelProcessor.processAndSaveLabel(testLabelUrl, testTrackingNumber);
    console.log('✅ Label processed successfully:', processedPath);
    
    // Check if file was created
    const fileExists = fs.existsSync(processedPath);
    console.log('✅ File exists:', fileExists);
    
    // Get file size
    if (fileExists) {
      const stats = fs.statSync(processedPath);
      console.log('✅ File size:', stats.size, 'bytes');
    }
    
    // Generate URL
    const labelUrl = labelProcessor.generateLabelUrl(testTrackingNumber);
    console.log('✅ Generated URL:', labelUrl);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLabelProcessing();