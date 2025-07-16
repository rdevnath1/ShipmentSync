import fetch from 'node-fetch';

const API_KEY = 'd370d0ee7e704117bfca9184bc03f590';
const BASE_URL = 'https://api.jygjexp.com/v1';

async function testOfficialTrackingEndpoint() {
  console.log('🔍 Testing OFFICIAL tracking endpoint from V3.8 documentation');
  console.log('=' * 50);
  
  // Test tracking numbers we know exist
  const trackingNumbers = [
    "GV25USA0U019900646",  // Recent successful order
    "GV25USA0U019889705",  // Earlier order
    "GV25USA0U019901232",  // Latest order
    "GV25USA0U019901096"   // Another recent order
  ];
  
  console.log('📋 Testing official endpoint: /api/tracking/query/trackInfo');
  console.log('📋 With apikey-only authentication (as per documentation)');
  
  try {
    const response = await fetch(`${BASE_URL}/api/tracking/query/trackInfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY  // Only apikey required per documentation
      },
      body: JSON.stringify(trackingNumbers)
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('\n✅ SUCCESS! Official tracking endpoint works:');
      console.log(JSON.stringify(data, null, 2));
    } else if (response.status === 404) {
      console.log('\n❌ Official endpoint returns 404 - may be deprecated');
    } else {
      const data = await response.json();
      console.log(`\n⚠️  Status ${response.status}:`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
  
  // Also test individual tracking numbers
  console.log('\n🔍 Testing individual tracking numbers:');
  
  for (const trackingNo of trackingNumbers) {
    try {
      const response = await fetch(`${BASE_URL}/api/tracking/query/trackInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify([trackingNo])  // Single tracking number in array
      });
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.code === 1 && data.data && data.data.length > 0) {
          console.log(`✅ ${trackingNo}: Found tracking data`);
        } else {
          console.log(`⚠️  ${trackingNo}: No tracking data (${data.message})`);
        }
      } else {
        console.log(`❌ ${trackingNo}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${trackingNo}: Request failed`);
    }
  }
  
  console.log('\n📊 CONCLUSION:');
  console.log('Testing the official V3.8 documented endpoint:');
  console.log('- Endpoint: /api/tracking/query/trackInfo');
  console.log('- Auth: apikey header only');
  console.log('- Body: Array of tracking numbers');
}

testOfficialTrackingEndpoint().catch(console.error);