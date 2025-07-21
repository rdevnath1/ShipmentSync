/**
 * Rate Verification Test Script
 * Tests multiple weight/zone combinations against Jiayou API
 * to verify accuracy against rate card
 */

import { JiayouService } from './server/services/jiayou.js';

const jiayouService = new JiayouService();

// Test cases based on common rate card scenarios
const testCases = [
  // Zone 1 (nearby states)
  { weight: 0.226796, zipCode: '10001', expectedZone: 1, description: '8 oz to NY (Zone 1)' },
  { weight: 0.453592, zipCode: '10001', expectedZone: 1, description: '1 lb to NY (Zone 1)' },
  { weight: 0.680388, zipCode: '10001', expectedZone: 1, description: '1.5 lb to NY (Zone 1)' },
  
  // Zone 3 (mid-range)
  { weight: 0.226796, zipCode: '33101', expectedZone: 3, description: '8 oz to Miami (Zone 3)' },
  { weight: 0.453592, zipCode: '33101', expectedZone: 3, description: '1 lb to Miami (Zone 3)' },
  
  // Zone 5 (medium distance)
  { weight: 0.226796, zipCode: '60601', expectedZone: 5, description: '8 oz to Chicago (Zone 5)' },
  { weight: 0.453592, zipCode: '60601', expectedZone: 5, description: '1 lb to Chicago (Zone 5)' },
  
  // Zone 8 (far west - we know this one works)
  { weight: 0.226796, zipCode: '90210', expectedZone: 8, description: '8 oz to Beverly Hills (Zone 8)' },
  { weight: 0.453592, zipCode: '90210', expectedZone: 8, description: '1 lb to Beverly Hills (Zone 8)' },
  { weight: 0.680388, zipCode: '90210', expectedZone: 8, description: '1.5 lb to Beverly Hills (Zone 8)' },
  
  // Zone 8 (Pacific Northwest)
  { weight: 0.453592, zipCode: '97201', expectedZone: 8, description: '1 lb to Portland (Zone 8)' },
  
  // Additional test weights
  { weight: 0.907184, zipCode: '90210', expectedZone: 8, description: '2 lb to Beverly Hills (Zone 8)' },
  { weight: 1.36078, zipCode: '90210', expectedZone: 8, description: '3 lb to Beverly Hills (Zone 8)' },
];

console.log('🔍 Starting Rate Verification Tests...\n');
console.log('Format: Weight | ZIP | Expected Zone | API Rate | API Zone | Status\n');

async function runTests() {
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const response = await jiayouService.checkPostalCodeCoverage(
        'US001',
        testCase.zipCode,
        { length: 10, width: 10, height: 5 }, // Standard small package dimensions
        testCase.weight
      );
      
      if (response.code === 1 && response.data && response.data[0]) {
        const rateData = response.data[0];
        const actualRate = parseFloat(rateData.totalFee);
        const actualZone = parseInt(rateData.areaCode);
        const zoneMatch = actualZone === testCase.expectedZone;
        
        console.log(`${(testCase.weight * 35.274).toFixed(1)}oz | ${testCase.zipCode} | Zone ${testCase.expectedZone} | $${actualRate.toFixed(2)} | Zone ${actualZone} | ${zoneMatch ? '✅' : '❌'}`);
        
        results.push({
          ...testCase,
          actualRate,
          actualZone,
          zoneMatch,
          success: true
        });
      } else {
        console.log(`${(testCase.weight * 35.274).toFixed(1)}oz | ${testCase.zipCode} | Zone ${testCase.expectedZone} | ERROR | - | ❌ ${rateData?.errMsg || 'No coverage'}`);
        
        results.push({
          ...testCase,
          success: false,
          error: rateData?.errMsg || 'No coverage'
        });
      }
    } catch (error) {
      console.log(`${(testCase.weight * 35.274).toFixed(1)}oz | ${testCase.zipCode} | Zone ${testCase.expectedZone} | ERROR | - | ❌ ${error.message}`);
      
      results.push({
        ...testCase,
        success: false,
        error: error.message
      });
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  const successful = results.filter(r => r.success);
  const zoneMatches = successful.filter(r => r.zoneMatch);
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful API Calls: ${successful.length}`);
  console.log(`Zone Matches: ${zoneMatches.length}/${successful.length}`);
  
  if (zoneMatches.length !== successful.length) {
    console.log('\n⚠️  Zone Mismatches Found:');
    successful.filter(r => !r.zoneMatch).forEach(r => {
      console.log(`  ${r.description}: Expected Zone ${r.expectedZone}, Got Zone ${r.actualZone}`);
    });
  }
  
  // Rate analysis for same zone
  console.log('\n💰 Zone 8 Rate Progression (90210):');
  const zone8Results = successful.filter(r => r.zipCode === '90210' && r.actualZone === 8);
  zone8Results.sort((a, b) => a.weight - b.weight);
  zone8Results.forEach(r => {
    const lbs = (r.weight * 2.20462).toFixed(2);
    console.log(`  ${lbs} lbs: $${r.actualRate.toFixed(2)}`);
  });
}

runTests().catch(console.error);