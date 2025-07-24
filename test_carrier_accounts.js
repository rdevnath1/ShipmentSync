// Node.js 18+ has built-in fetch

async function testCarrierAccounts() {
  try {
    // First login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rc@trend36fashion.com',
        password: 'password123'
      })
    });
    
    const setCookie = loginRes.headers.get('set-cookie');
    const user = await loginRes.json();
    console.log('Login response:', user);
    console.log('Cookie:', setCookie);
    
    if (!setCookie) {
      console.log('No cookie received');
      return;
    }
    
    // Get carrier accounts
    const getRes = await fetch('http://localhost:5000/api/carrier-accounts', {
      headers: { 'Cookie': setCookie }
    });
    
    const accounts = await getRes.json();
    console.log('Current carrier accounts:', accounts);
    
    // Add a FedEx test account
    const addRes = await fetch('http://localhost:5000/api/carrier-accounts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': setCookie
      },
      body: JSON.stringify({
        carrier: 'fedex',
        accountNumber: 'TEST123456',
        meterNumber: 'METER789',
        key: 'FEDEX_KEY_123',
        password: 'FEDEX_PASS_456'
      })
    });
    
    const newAccount = await addRes.json();
    console.log('New account added:', newAccount);
    
    // Test rate comparison
    const rateRes = await fetch('http://localhost:5000/api/rates/compare', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': setCookie
      },
      body: JSON.stringify({
        fromZip: '11430',
        toZip: '90210',
        weight: 16, // 1 lb in oz
        dimensions: { length: 10, width: 8, height: 6 }
      })
    });
    
    const rates = await rateRes.json();
    console.log('Rate comparison result:', JSON.stringify(rates, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCarrierAccounts();