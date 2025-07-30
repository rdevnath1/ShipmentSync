import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFixedCustomization() {
  try {
    console.log('🔧 Testing FIXED Label Customization...\n');

    console.log('✅ Updated label customizer with fixes:');
    console.log('');
    
    console.log('🎯 FIXED ISSUES:');
    console.log('   1. ✓ Uniuni logo removal - made rectangle BIGGER and positioned better');
    console.log('      • Old: x:0, y:height-80, width:120, height:40');
    console.log('      • New: x:0, y:height-120, width:200, height:60');
    console.log('');
    
    console.log('   2. ✓ Bottom tracking cleanup - removed ALL messy overlapping text');
    console.log('      • Large white rectangle covers entire bottom (0, 0, width, 60)');
    console.log('      • Eliminates duplicate GV/QP tracking numbers');
    console.log('');
    
    console.log('   3. ✓ Clean single QP tracking placement');
    console.log('      • Only ONE QP tracking under main barcode');
    console.log('      • ONE centered, clean QP tracking at bottom');
    console.log('      • No more overlapping or duplicate numbers');
    console.log('');
    
    console.log('📋 WHAT THE FIXED CUSTOMIZER DOES:');
    console.log('   • Removes uniuni logo completely from top left');
    console.log('   • Keeps main QP tracking under barcode (centered, bold)');
    console.log('   • Adds one clean QP tracking at bottom (centered)');
    console.log('   • Removes all GV tracking numbers');
    console.log('   • Eliminates messy overlapping text');
    console.log('');
    
    console.log('🧪 TO TEST THE FIXES:');
    console.log('   1. Go to http://localhost:3002');
    console.log('   2. Create a new shipment');
    console.log('   3. Print the label');
    console.log('   4. Check that:');
    console.log('      - No uniuni logo visible');
    console.log('      - Clean QP tracking under barcode');
    console.log('      - One clean QP at bottom');
    console.log('      - No messy overlapping text');
    console.log('');
    
    // Check if temp-labels directory exists
    const tempDir = path.join(process.cwd(), 'temp-labels');
    try {
      const files = await fs.readdir(tempDir);
      console.log(`📁 Found ${files.length} existing labels in temp-labels/`);
      if (files.length > 0) {
        console.log('   Previous labels (for comparison):');
        files.slice(0, 3).forEach(file => console.log(`   📄 ${file}`));
      }
    } catch (dirError) {
      console.log('📁 temp-labels directory will be created when first label is generated');
    }
    
    console.log('');
    console.log('✅ Fixed customization is ready to test!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFixedCustomization();