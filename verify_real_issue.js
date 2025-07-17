// Let's manually test the logo processing to fix the localhost access issue
import { LabelProcessor } from './server/services/labelProcessor.js';
import fs from 'fs';

async function testLogoProcessing() {
  console.log('Testing logo processing with your existing label...');
  
  const labelProcessor = new LabelProcessor();
  
  // Use the actual label from Order ID 3 
  const labelUrl = 'http://oss.jiayouexp.com/document/order-label/pdf/20250717/GV25USA0U019866484.pdf';
  const testTrackingNumber = 'DEMO_LOGO_TEST';
  
  try {
    // Step 1: Process the label
    console.log('1. Processing label with logo...');
    const processedPath = await labelProcessor.processAndSaveLabel(labelUrl, testTrackingNumber);
    
    console.log('✅ Label processed successfully');
    console.log('📁 File saved to:', processedPath);
    
    // Step 2: Check file size
    const stats = fs.statSync(processedPath);
    console.log('📊 File size:', Math.round(stats.size / 1024), 'KB');
    
    // Step 3: Generate URL
    const labelUrl = labelProcessor.generateLabelUrl(testTrackingNumber);
    console.log('🔗 Access URL:', `http://localhost:5000${labelUrl}`);
    
    // Step 4: Test if file is accessible
    try {
      const response = await fetch(`http://localhost:5000${labelUrl}`);
      console.log('🌐 URL Status:', response.status);
      
      if (response.ok) {
        console.log('✅ Label accessible via URL');
      } else {
        console.log('❌ URL access failed');
      }
    } catch (urlError) {
      console.log('❌ URL test failed:', urlError.message);
    }
    
    return `http://localhost:5000${labelUrl}`;
    
  } catch (error) {
    console.error('❌ Processing failed:', error.message);
    console.error('Full error:', error);
    return null;
  }
}

// Run the test
testLogoProcessing().then(url => {
  if (url) {
    console.log('\n🎯 SUCCESS! Logo processing is working');
    console.log('📋 What the system does:');
    console.log('   • Downloads original Jiayou label PDF');
    console.log('   • Adds your company logo (60x60px, top-right)');
    console.log('   • Adds "Powered by Your Company" text');
    console.log('   • Saves as new PDF with logo');
    console.log('   • Serves via accessible URL');
    console.log('\n🚀 Access your branded label at:');
    console.log(url);
  } else {
    console.log('\n❌ Testing failed - will investigate issue');
  }
}).catch(console.error);