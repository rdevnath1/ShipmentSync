import axios from 'axios';

async function testCoverage() {
  try {
    const response = await axios.post(
      'https://api.jygjexp.com/v1/outerApi/costCal',
      {
        channelCode: ["US001"],
        length: 10,
        width: 8,
        height: 6,
        weight: 0.453592, // 1 lb in kg
        postCode: "90210",
        iso2: "US",
        fromAddressId: "JFK"
      },
      { 
        headers: { 
          'apikey': 'd370d0ee7e704117bfca9184bc03f590',
          'Content-Type': 'application/json'
        } 
      }
    );

    console.log('Coverage check response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testCoverage();