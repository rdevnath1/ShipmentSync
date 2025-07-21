/**
 * Simple Rate Verification using our API endpoint
 */

const testCases = [
  // Zone 1 tests (nearby)
  { pickup: '11430', delivery: '10001', weight: 8, desc: '8oz to NY (Zone 1)' },
  { pickup: '11430', delivery: '10001', weight: 16, desc: '1lb to NY (Zone 1)' },
  
  // Zone 3 tests  
  { pickup: '11430', delivery: '33101', weight: 8, desc: '8oz to Miami (Zone 3)' },
  { pickup: '11430', delivery: '33101', weight: 16, desc: '1lb to Miami (Zone 3)' },
  
  // Zone 5 tests
  { pickup: '11430', delivery: '60601', weight: 8, desc: '8oz to Chicago (Zone 5)' },
  { pickup: '11430', delivery: '60601', weight: 16, desc: '1lb to Chicago (Zone 5)' },
  
  // Zone 8 tests (known working)
  { pickup: '11430', delivery: '90210', weight: 8, desc: '8oz to Beverly Hills (Zone 8)' },
  { pickup: '11430', delivery: '90210', weight: 16, desc: '1lb to Beverly Hills (Zone 8)' },
  { pickup: '11430', delivery: '90210', weight: 24, desc: '1.5lb to Beverly Hills (Zone 8)' },
  { pickup: '11430', delivery: '90210', weight: 32, desc: '2lb to Beverly Hills (Zone 8)' },
  { pickup: '11430', delivery: '90210', weight: 48, desc: '3lb to Beverly Hills (Zone 8)' },
  
  // Other Zone 8 locations
  { pickup: '11430', delivery: '97201', weight: 16, desc: '1lb to Portland (Zone 8)' },
  { pickup: '11430', delivery: '85001', weight: 16, desc: '1lb to Phoenix (Zone 8)' },
];

async function testRates() {
  console.log('🔍 Testing Rate Accuracy Against Your Rate Card\n');
  console.log('Weight | From | To | Zone | Rate | Status');
  console.log('-------|------|----|----- |----- |-------');
  
  for (const test of testCases) {
    try {
      const response = await fetch('http://localhost:5000/api/rates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dummy' // We'll need to handle auth
        },
        body: JSON.stringify({
          pickupZipCode: test.pickup,
          deliveryZipCode: test.delivery,
          weight: test.weight / 35.274, // Convert oz to kg
          dimensions: { length: 10, width: 10, height: 5 },
          serviceType: 'standard'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const rate = data.preview?.estimatedCost?.formatted || 'N/A';
        const zone = data.preview?.rateCalculation?.zone || 'Unknown';
        console.log(`${test.weight}oz | ${test.pickup} | ${test.delivery} | ${zone} | ${rate} | ✅`);
      } else {
        const error = await response.text();
        console.log(`${test.weight}oz | ${test.pickup} | ${test.delivery} | - | ERROR | ❌`);
        console.log(`   Error: ${error.substring(0, 50)}...`);
      }
    } catch (error) {
      console.log(`${test.weight}oz | ${test.pickup} | ${test.delivery} | - | ERROR | ❌`);
      console.log(`   Error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

testRates();