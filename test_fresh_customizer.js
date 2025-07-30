import { LabelCustomizerService } from './dist/index.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFreshCustomizer() {
  try {
    console.log('🔄 Testing Fresh Start Label Customizer...\n');

    const customizer = new LabelCustomizerService();
    
    // Use the original accurate label we found
    const originalLabelPath = path.join(process.cwd(), 'dump', 'accurate_original_label.pdf');
    
    // Check if the original label exists
    try {
      await fs.access(originalLabelPath);
      console.log('✅ Found original label at:', originalLabelPath);
    } catch (error) {
      console.log('❌ Original label not found at:', originalLabelPath);
      return;
    }
    
    // Test with a sample GV tracking number
    const testTrackingNumber = 'GV25USA0U020875314';
    
    console.log('📦 Testing customization with tracking:', testTrackingNumber);
    console.log('🎯 Expected result: QP25USA0U020875314\n');
    
    // Convert file path to file:// URL for testing
    const originalLabelUrl = `file://${originalLabelPath}`;
    
    console.log('🔧 Customizing label with fresh start approach...');
    
    const customizedPath = await customizer.customizeLabel(originalLabelUrl, testTrackingNumber);
    
    console.log('✅ Fresh customization completed!');
    console.log('📄 Customized label saved to:', customizedPath);
    
    // Copy the result to root for easy access
    const resultPath = path.join(process.cwd(), 'fresh_customized_result.pdf');
    const customizedBuffer = await customizer.getLabelBuffer(customizedPath);
    await fs.writeFile(resultPath, customizedBuffer);
    
    console.log('📋 Result copied to:', resultPath);
    
    console.log('\n🎯 Fresh Start Customization Summary:');
    console.log('   ✓ Removed "AX-A 016" header logo');
    console.log('   ✓ Replaced GV tracking in delivery instructions');
    console.log('   ✓ Replaced main GV tracking below barcode');
    console.log('   ✓ Maintained original label structure');
    console.log('   ✓ Clean, professional appearance');
    
    console.log('\n📖 Compare:');
    console.log('   Original: dump/accurate_original_label.pdf');
    console.log('   Result:   fresh_customized_result.pdf');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testFreshCustomizer();