import { LabelProcessor } from './server/services/labelProcessor.js';
import fs from 'fs';

async function createLiveDemo() {
  console.log('🚀 LIVE DEMO: Logo Processing for Jiayou Labels');
  console.log('================================================');
  
  const labelProcessor = new LabelProcessor();
  
  // Use the actual label from Order ID 3 in your system
  const labelUrl = 'http://oss.jiayouexp.com/document/order-label/pdf/20250717/GV25USA0U019866484.pdf';
  const trackingNumber = 'GV25USA0U019866484';
  
  try {
    console.log('📥 Step 1: Downloading original Jiayou label...');
    console.log('   URL:', labelUrl);
    
    console.log('🎨 Step 2: Processing label with your logo...');
    console.log('   Logo:', 'attached_assets/logo_1752442395960.png');
    
    const processedPath = await labelProcessor.processAndSaveLabel(labelUrl, trackingNumber);
    
    console.log('✅ Step 3: Label processed successfully!');
    console.log('   Output:', processedPath);
    
    // Get file info
    const stats = fs.statSync(processedPath);
    console.log('   Size:', Math.round(stats.size / 1024), 'KB');
    
    // Generate public URL
    const publicUrl = labelProcessor.generateLabelUrl(trackingNumber);
    console.log('   Public URL:', `http://localhost:5000${publicUrl}`);
    
    console.log('\n🎯 What was added to the label:');
    console.log('   • Your company logo (top-right corner, 60x60px)');
    console.log('   • Transparent background for clean appearance');
    console.log('   • "Powered by Your Company" branding text');
    console.log('   • Maintains all original Jiayou shipping information');
    
    console.log('\n📦 Integration flow:');
    console.log('   1. Order created in Jiayou → Original label generated');
    console.log('   2. System downloads and processes label → Adds logo');
    console.log('   3. Processed label sent to ShipStation → Branded printing');
    console.log('   4. Your customers see your branding on packages');
    
    return `http://localhost:5000${publicUrl}`;
    
  } catch (error) {
    console.error('❌ Error in demo:', error.message);
    console.log('\n🔧 The system includes fallback logic:');
    console.log('   • If logo processing fails, uses original label');
    console.log('   • Ensures shipments always have valid labels');
    console.log('   • Logs errors for debugging');
    
    return null;
  }
}

// Run the demo
createLiveDemo().then(url => {
  if (url) {
    console.log('\n🌟 DEMO COMPLETE!');
    console.log('Access your branded label at:', url);
    console.log('\nTo test: Create a new shipment and the logo will be automatically added!');
  }
}).catch(console.error);