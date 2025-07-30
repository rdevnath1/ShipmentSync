import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testExistingLabels() {
  try {
    console.log('🧪 Testing Existing Customized Labels...\n');

    // Check temp-labels directory
    const tempLabelsDir = path.join(process.cwd(), 'temp-labels');
    const files = await fs.readdir(tempLabelsDir);
    
    if (files.length === 0) {
      console.log('❌ No customized labels found in temp-labels/');
      return;
    }

    console.log(`✅ Found ${files.length} customized labels in temp-labels/`);
    
    // Show the most recent label
    const mostRecentFile = files[files.length - 1];
    console.log(`📄 Most recent label: ${mostRecentFile}`);
    
    // Extract tracking number from filename
    const trackingMatch = mostRecentFile.match(/customized_(GV\d+)_/);
    if (trackingMatch) {
      const originalTracking = trackingMatch[1];
      const expectedTracking = originalTracking.replace(/^GV/, 'QP');
      console.log(`   Original tracking: ${originalTracking}`);
      console.log(`   Expected customized: ${expectedTracking}`);
    }

    // Check file sizes to ensure they're valid PDFs
    const filePath = path.join(tempLabelsDir, mostRecentFile);
    const stats = await fs.stat(filePath);
    console.log(`   File size: ${stats.size} bytes`);
    console.log(`   Created: ${stats.mtime.toLocaleString()}`);

    // Read the first few bytes to verify it's a PDF
    const buffer = await fs.readFile(filePath);
    const header = buffer.toString('ascii', 0, 4);
    if (header === '%PDF') {
      console.log('✅ File is a valid PDF');
    } else {
      console.log('❌ File does not appear to be a valid PDF');
    }

    console.log('\n🎯 Label Customization Summary:');
    console.log('   The system should have automatically:');
    console.log('   • Removed logos from the top-right corner');
    console.log('   • Replaced GV with QP in tracking numbers (in 2 places)');
    console.log('\n📋 To verify the customization:');
    console.log('   1. Open one of the PDF files in temp-labels/');
    console.log('   2. Check that the logo is removed from the top-right');
    console.log('   3. Verify tracking numbers show QP instead of GV');
    console.log('   4. Look for the tracking number in two locations on the label');

    // List all available labels
    console.log('\n📁 All available customized labels:');
    files.forEach((file, index) => {
      const trackingMatch = file.match(/customized_(GV\d+)_/);
      const tracking = trackingMatch ? trackingMatch[1].replace(/^GV/, 'QP') : 'Unknown';
      console.log(`   ${index + 1}. ${file} (${tracking})`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testExistingLabels(); 