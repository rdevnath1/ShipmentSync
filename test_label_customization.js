import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testLabelCustomization() {
  try {
    console.log('🧪 Testing Label Customization System...\n');

    // Test 1: Check if the server is running
    console.log('1. Testing server connectivity...');
    try {
      const healthResponse = await axios.get('http://localhost:3000/api/health');
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running. Please start the server first.');
      console.log('   Run: npm run dev');
      return;
    }

    // Test 2: Check if there are any existing shipments to test with
    console.log('\n2. Checking for existing shipments...');
    try {
      const shipmentsResponse = await axios.get('http://localhost:3000/api/shipments');
      const shipments = shipmentsResponse.data;
      
      if (shipments && shipments.length > 0) {
        console.log(`✅ Found ${shipments.length} shipments`);
        
        // Find a shipment with a tracking number
        const shipmentWithTracking = shipments.find(s => s.trackingNumber);
        if (shipmentWithTracking) {
          console.log(`📦 Found shipment with tracking: ${shipmentWithTracking.trackingNumber}`);
          console.log(`   Order ID: ${shipmentWithTracking.id}`);
          console.log(`   Status: ${shipmentWithTracking.status}`);
          
          // Test 3: Test label printing for this shipment
          console.log('\n3. Testing label printing...');
          try {
            const printResponse = await axios.post(`http://localhost:3000/api/shipments/${shipmentWithTracking.id}/print`);
            const printData = printResponse.data;
            
            if (printData.labelPath) {
              console.log('✅ Label printing successful!');
              console.log(`   Original tracking: ${shipmentWithTracking.trackingNumber}`);
              console.log(`   Customized tracking: ${printData.trackingNumber}`);
              console.log(`   Label path: ${printData.labelPath}`);
              
              // Test 4: Try to access the customized label
              console.log('\n4. Testing customized label access...');
              try {
                const labelUrl = `http://localhost:3000${printData.labelPath}`;
                const labelResponse = await axios.get(labelUrl, {
                  responseType: 'arraybuffer'
                });
                
                if (labelResponse.data) {
                  console.log('✅ Customized label is accessible!');
                  console.log(`   File size: ${labelResponse.data.length} bytes`);
                  
                  // Save the label for inspection
                  const testLabelPath = path.join(process.cwd(), 'test_customized_label.pdf');
                  await fs.writeFile(testLabelPath, labelResponse.data);
                  console.log(`   Saved test label to: ${testLabelPath}`);
                }
              } catch (labelError) {
                console.log('❌ Could not access customized label:', labelError.message);
              }
            } else {
              console.log('❌ No label path returned from print request');
            }
          } catch (printError) {
            console.log('❌ Label printing failed:', printError.response?.data?.error || printError.message);
          }
        } else {
          console.log('❌ No shipments with tracking numbers found');
        }
      } else {
        console.log('❌ No shipments found');
      }
    } catch (shipmentsError) {
      console.log('❌ Could not fetch shipments:', shipmentsError.message);
    }

    // Test 5: Check temp-labels directory
    console.log('\n5. Checking temp-labels directory...');
    try {
      const tempLabelsDir = path.join(process.cwd(), 'temp-labels');
      const files = await fs.readdir(tempLabelsDir);
      
      if (files.length > 0) {
        console.log(`✅ Found ${files.length} customized labels in temp-labels/`);
        files.slice(0, 5).forEach(file => {
          console.log(`   📄 ${file}`);
        });
        if (files.length > 5) {
          console.log(`   ... and ${files.length - 5} more files`);
        }
      } else {
        console.log('❌ No customized labels found in temp-labels/');
      }
    } catch (dirError) {
      console.log('❌ Could not access temp-labels directory:', dirError.message);
    }

    console.log('\n🎯 Test Summary:');
    console.log('   - The label customization system should automatically:');
    console.log('     • Remove logos from the top-right corner');
    console.log('     • Replace GV with QP in tracking numbers (in 2 places)');
    console.log('   - Check the test_customized_label.pdf file to verify the changes');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testLabelCustomization(); 