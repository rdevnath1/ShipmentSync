import { LabelProcessor } from './server/services/labelProcessor.js';

async function createTestLabel() {
  const labelProcessor = new LabelProcessor();
  
  // Use existing label from your system
  const labelUrl = 'http://oss.jiayouexp.com/document/order-label/pdf/20250717/GV25USA0U019866484.pdf';
  const trackingNumber = 'TEST_DEMO_123';
  
  try {
    console.log('Creating test label with logo...');
    const result = await labelProcessor.processAndSaveLabel(labelUrl, trackingNumber);
    console.log('Success:', result);
    
    const url = labelProcessor.generateLabelUrl(trackingNumber);
    console.log('Access URL:', `http://localhost:5000${url}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestLabel();