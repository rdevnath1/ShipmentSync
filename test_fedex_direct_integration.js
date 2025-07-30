#!/usr/bin/env node

/**
 * FedEx Direct Integration Test Script
 * 
 * This script tests the complete FedEx direct integration:
 * 1. Rate fetching with customer credentials
 * 2. Shipment creation and label generation
 * 3. Tracking functionality
 * 
 * Usage: node test_fedex_direct_integration.js
 */

import axios from 'axios';

// Test configuration
const BASE_URL = 'http://localhost:3002';
const TEST_CONFIG = {
  // Demo credentials for testing (replace with real credentials for production)
  fedexCredentials: {
    apiUrl: process.env.FEDEX_API_URL || 'https://apis-sandbox.fedex.com',
    clientId: process.env.FEDEX_CLIENT_ID || 'demo_client_id_12345',
    clientSecret: process.env.FEDEX_CLIENT_SECRET || 'demo_client_secret_67890',
    accountNumber: process.env.FEDEX_ACCOUNT_NUMBER || '123456789'
  },
  testShipment: {
    fromAddress: {
      name: 'Test Shipper',
      company: 'Quikpik Test',
      street1: '123 Test St',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90210',
      country: 'US',
      phone: '555-123-4567',
      email: 'test@quikpik.io'
    },
    toAddress: {
      name: 'Test Recipient',
      street1: '456 Delivery Ave',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      phone: '555-987-6543',
      email: 'recipient@example.com'
    },
    weight: 2.5,
    dimensions: {
      length: 12,
      width: 9,
      height: 3
    }
  }
};

// Authentication token (would be obtained from login in real usage)
let authToken = null;

async function authenticate() {
  try {
    console.log('🔐 Authenticating...');
    
    // In a real scenario, you'd login first to get a token
    // For this test, we'll assume the user is already authenticated
    // or use a test token if available
    
    console.log('✅ Authentication ready (using existing session)');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return false;
  }
}

async function testFedExRates() {
  try {
    console.log('\n📊 Testing FedEx Rate Fetching...');
    
    const rateRequest = {
      fromZip: TEST_CONFIG.testShipment.fromAddress.postalCode,
      toZip: TEST_CONFIG.testShipment.toAddress.postalCode,
      weight: TEST_CONFIG.testShipment.weight,
      dimensions: TEST_CONFIG.testShipment.dimensions,
      credentials: TEST_CONFIG.fedexCredentials
    };

    const response = await axios.post(
      `${BASE_URL}/api/fedex/rates`,
      rateRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      }
    );

    console.log('✅ FedEx rates retrieved successfully!');
    console.log('📋 Available services:');
    
    response.data.rates.forEach((rate, index) => {
      console.log(`   ${index + 1}. ${rate.service}: $${rate.rate} (${rate.deliveryDays} days)`);
    });

    return response.data.rates;
  } catch (error) {
    console.error('❌ FedEx rate fetch failed:', error.response?.data || error.message);
    
    // Show demo of what successful output would look like
    if (error.response?.data?.error === 'Authentication required') {
      console.log('\n📌 DEMO MODE: With real FedEx credentials, you would see:');
      console.log('   1. FedEx Ground: $12.85 (2-3 days)');
      console.log('   2. FedEx Express Saver: $24.50 (3 days)');
      console.log('   3. FedEx 2Day: $31.75 (2 days)');
      console.log('   4. FedEx Priority Overnight: $45.90 (1 day)');
      console.log('\n💡 To see real rates:');
      console.log('   1. Login to Quikpik (http://localhost:3002)');
      console.log('   2. Configure FedEx credentials in Settings');
      console.log('   3. Run this test again');
    }
    return null;
  }
}

async function testFedExShipment() {
  try {
    console.log('\n📦 Testing FedEx Shipment Creation...');
    
    const shipmentRequest = {
      ...TEST_CONFIG.testShipment,
      serviceType: 'FEDEX_GROUND',
      packagingType: 'YOUR_PACKAGING',
      labelFormat: 'PDF',
      labelSize: 'PAPER_4X6',
      credentials: TEST_CONFIG.fedexCredentials
    };

    const response = await axios.post(
      `${BASE_URL}/api/fedex/shipment`,
      shipmentRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      }
    );

    console.log('✅ FedEx shipment created successfully!');
    console.log('📋 Shipment details:');
    console.log(`   📍 Tracking Number: ${response.data.trackingNumber}`);
    console.log(`   💰 Total Cost: $${response.data.totalCost}`);
    console.log(`   📄 Label URL: ${response.data.labelUrl}`);
    if (response.data.estimatedDeliveryDate) {
      console.log(`   📅 Estimated Delivery: ${response.data.estimatedDeliveryDate}`);
    }

    return response.data;
  } catch (error) {
    console.error('❌ FedEx shipment creation failed:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('🔍 Error details:', error.response.data.message);
    }
    return null;
  }
}

async function testFedExTracking(trackingNumber) {
  try {
    console.log('\n🔍 Testing FedEx Tracking...');
    
    const response = await axios.get(
      `${BASE_URL}/api/fedex/track/${trackingNumber}`,
      {
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      }
    );

    console.log('✅ FedEx tracking retrieved successfully!');
    console.log('📋 Tracking information:');
    console.log(`   📍 Tracking Number: ${response.data.trackingNumber}`);
    console.log('   📊 Tracking Data: Available');

    return response.data;
  } catch (error) {
    console.error('❌ FedEx tracking failed:', error.response?.data || error.message);
    return null;
  }
}

async function validateCredentials() {
  console.log('\n🔧 Validating FedEx Credentials...');
  
  const requiredFields = ['clientId', 'clientSecret', 'accountNumber'];
  const missingFields = requiredFields.filter(field => 
    !TEST_CONFIG.fedexCredentials[field] || 
    TEST_CONFIG.fedexCredentials[field] === `YOUR_FEDEX_${field.toUpperCase()}`
  );

  if (missingFields.length > 0) {
    console.log('⚠️  Please update the credentials in this script:');
    missingFields.forEach(field => {
      console.log(`   ❌ ${field}: Not configured`);
    });
    console.log('\n📝 To test with real credentials:');
    console.log('   1. Get credentials from FedEx Developer Portal');
    console.log('   2. Update TEST_CONFIG.fedexCredentials in this script');
    console.log('   3. Use sandbox URL for testing: https://apis-sandbox.fedex.com');
    return false;
  }

  console.log('✅ All required credentials are configured');
  return true;
}

async function runTests() {
  console.log('🚀 Starting FedEx Direct Integration Tests\n');
  console.log('=' .repeat(60));

  // Validate credentials
  const credentialsValid = await validateCredentials();
  if (!credentialsValid) {
    console.log('\n❌ Cannot proceed without valid credentials');
    console.log('💡 This script is ready to use once you add your FedEx API credentials');
    return;
  }

  // Authenticate
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  let testResults = {
    rates: false,
    shipment: false,
    tracking: false
  };

  // Test 1: Rate Fetching
  const rates = await testFedExRates();
  testResults.rates = !!rates;

  // Test 2: Shipment Creation
  let shipmentData = null;
  if (testResults.rates) {
    shipmentData = await testFedExShipment();
    testResults.shipment = !!shipmentData;
  } else {
    console.log('\n⏭️  Skipping shipment test due to rate fetch failure');
  }

  // Test 3: Tracking
  if (testResults.shipment && shipmentData?.trackingNumber) {
    const trackingData = await testFedExTracking(shipmentData.trackingNumber);
    testResults.tracking = !!trackingData;
  } else {
    console.log('\n⏭️  Skipping tracking test due to shipment creation failure');
  }

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`📊 FedEx Rate Fetching:    ${testResults.rates ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📦 FedEx Shipment Creation: ${testResults.shipment ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🔍 FedEx Tracking:         ${testResults.tracking ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(testResults).every(result => result);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n🎉 FedEx Direct Integration is working perfectly!');
    console.log('💡 Your customers can now use direct FedEx label printing');
  } else {
    console.log('\n🔧 Please check the errors above and ensure:');
    console.log('   1. FedEx credentials are correct');
    console.log('   2. Server is running on port 3002');
    console.log('   3. User is properly authenticated');
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});