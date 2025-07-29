const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000';

// Login and get auth token
async function login() {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'raj@trend36fashion.com',
      password: 'admin123'
    })
  });
  
  const cookies = response.headers.raw()['set-cookie'];
  return cookies;
}

// Test fetching middleware analytics
async function testMiddlewareAnalytics(cookies) {
  console.log('\n📊 Testing Middleware Analytics API...\n');
  
  // Test summary endpoint
  console.log('1. Testing analytics summary:');
  const summaryResponse = await fetch(`${API_BASE_URL}/api/middleware/analytics/summary`, {
    headers: { 
      'Cookie': cookies.join('; ')
    }
  });
  
  if (summaryResponse.ok) {
    const summary = await summaryResponse.json();
    console.log('✅ Summary fetched successfully:');
    console.log(`   - Total Orders: ${summary.totalOrders}`);
    console.log(`   - Quikpik Orders: ${summary.quikpikOrders}`);
    console.log(`   - Traditional Orders: ${summary.traditionalOrders}`);
    console.log(`   - Total Saved: $${summary.totalSaved.toFixed(2)}`);
    console.log(`   - Average Savings: $${summary.averageSavings.toFixed(2)}`);
    console.log(`   - Capture Rate: ${summary.captureRate.toFixed(1)}%`);
  } else {
    console.log('❌ Failed to fetch summary:', await summaryResponse.text());
  }
  
  // Test recent decisions endpoint
  console.log('\n2. Testing recent routing decisions:');
  const recentResponse = await fetch(`${API_BASE_URL}/api/middleware/analytics/recent`, {
    headers: { 
      'Cookie': cookies.join('; ')
    }
  });
  
  if (recentResponse.ok) {
    const recent = await recentResponse.json();
    console.log(`✅ Recent decisions fetched: ${recent.length} decisions`);
    if (recent.length > 0) {
      console.log('\n   Latest routing decision:');
      const latest = recent[0];
      console.log(`   - Order ID: ${latest.orderId}`);
      console.log(`   - Routed to: ${latest.routedTo}`);
      console.log(`   - Reason: ${latest.reason}`);
      console.log(`   - Quikpik Rate: $${latest.quikpikRate.toFixed(2)}`);
      console.log(`   - Alternative Rate: $${latest.alternativeRate.toFixed(2)}`);
      console.log(`   - Saved: $${latest.saved.toFixed(2)}`);
    }
  } else {
    console.log('❌ Failed to fetch recent decisions:', await recentResponse.text());
  }
  
  // Test full analytics endpoint with filters
  console.log('\n3. Testing full analytics with filters:');
  const analyticsResponse = await fetch(`${API_BASE_URL}/api/middleware/analytics?routedTo=quikpik`, {
    headers: { 
      'Cookie': cookies.join('; ')
    }
  });
  
  if (analyticsResponse.ok) {
    const analytics = await analyticsResponse.json();
    console.log(`✅ Analytics fetched: ${analytics.length} Quikpik routing records`);
  } else {
    console.log('❌ Failed to fetch analytics:', await analyticsResponse.text());
  }
}

// Run the test
async function runTest() {
  try {
    console.log('🚀 Starting Middleware Analytics Test...');
    
    const cookies = await login();
    console.log('✅ Logged in successfully');
    
    await testMiddlewareAnalytics(cookies);
    
    console.log('\n✨ Middleware Analytics test completed!');
    console.log('\nℹ️  Note: If you see 0 orders, run the middleware test first to generate some data:');
    console.log('   node test_complete_middleware.js');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTest();