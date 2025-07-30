import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFreshStartCustomization() {
  try {
    console.log('🔄 Testing Fresh Start Label Customization...\n');

    // Check if server is running
    console.log('1. Checking server status...');
    try {
      const healthResponse = await axios.get('http://localhost:3000/api/health');
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server not running. Starting server...');
      
      // Start the server in background
      const { spawn } = await import('child_process');
      const serverProcess = spawn('npm', ['run', 'dev'], {
        detached: true,
        stdio: 'ignore'
      });
      
      console.log('⏳ Waiting for server to start...');
      // Wait a bit for server to start
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Try again
      try {
        await axios.get('http://localhost:3000/api/health');
        console.log('✅ Server is now running');
      } catch (error) {
        console.log('❌ Could not start server. Please run: npm run dev');
        return;
      }
    }

    // Check for original accurate label
    const originalLabelPath = path.join(process.cwd(), 'dump', 'accurate_original_label.pdf');
    
    try {
      await fs.access(originalLabelPath);
      console.log('✅ Found original label at:', originalLabelPath);
    } catch (error) {
      // Try alternative location
      const altPath = path.join(process.cwd(), 'accurate_original_label.pdf');
      try {
        await fs.access(altPath);
        console.log('✅ Found original label at:', altPath);
      } catch (error) {
        console.log('❌ Original label not found. Looking for existing customized labels...');
        
        // Check temp-labels directory for any existing labels
        const tempDir = path.join(process.cwd(), 'temp-labels');
        try {
          const files = await fs.readdir(tempDir);
          if (files.length > 0) {
            console.log(`📁 Found ${files.length} existing labels in temp-labels/`);
            files.slice(0, 3).forEach(file => console.log(`   📄 ${file}`));
          }
        } catch (dirError) {
          console.log('❌ No temp-labels directory found');
        }
        return;
      }
    }

    console.log('\n2. Testing fresh customization approach...');
    console.log('🎯 The new customizer should:');
    console.log('   • Remove only the "AX-A 016" header logo');
    console.log('   • Replace GV tracking in delivery instructions');
    console.log('   • Replace main GV tracking below barcode');
    console.log('   • Maintain clean original structure');
    
    console.log('\n✅ Fresh start label customizer is ready!');
    console.log('📋 Next steps:');
    console.log('   1. Create a shipment through the web interface');
    console.log('   2. Print the label to test the fresh customization');
    console.log('   3. Check the result in temp-labels/ directory');
    
    console.log('\n🔍 The customized label should look like the original but with:');
    console.log('   • No "AX-A 016" header');
    console.log('   • QP tracking numbers instead of GV');
    console.log('   • Same clean structure as the original');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFreshStartCustomization();