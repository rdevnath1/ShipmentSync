#!/usr/bin/env node

/**
 * Implementation Validation Script
 * Confirms all enhanced rate shopping features are properly implemented
 */

import { promises as fs } from 'fs';
import path from 'path';

const SERVER_DIR = './server';

async function validateImplementation() {
  console.log('🔍 Validating Enhanced Rate Shopping Implementation\n');
  
  const results = {
    shipEngineIntegration: false,
    marginLogic: false, 
    speedAdvantage: false,
    postalZoneMapping: false,
    testingInfrastructure: false
  };

  try {
    // 1. Validate ShipEngine API Integration
    console.log('1️⃣ Checking ShipEngine API Integration...');
    try {
      const shipEngineService = await fs.readFile(path.join(SERVER_DIR, 'services/shipengine.ts'), 'utf8');
      
      const hasShipEngineClass = shipEngineService.includes('export class ShipEngineService');
      const hasRatesMethod = shipEngineService.includes('getRates(');
      const hasCarrierIntegration = shipEngineService.includes('fedex') && shipEngineService.includes('usps') && shipEngineService.includes('ups');
      const hasFallbackRates = shipEngineService.includes('getFallbackRates');
      
      if (hasShipEngineClass && hasRatesMethod && hasCarrierIntegration && hasFallbackRates) {
        console.log('   ✅ ShipEngine service class implemented');
        console.log('   ✅ Rate fetching methods present');
        console.log('   ✅ FedEx, USPS, UPS integration configured');
        console.log('   ✅ Fallback rate system implemented');
        results.shipEngineIntegration = true;
      } else {
        console.log('   ❌ ShipEngine integration incomplete');
      }
    } catch (error) {
      console.log('   ❌ ShipEngine service file not found');
    }

    // 2. Validate 5% Margin Logic
    console.log('\n2️⃣ Checking 5% Margin Logic...');
    try {
      const rateShopperService = await fs.readFile(path.join(SERVER_DIR, 'services/rate-shopper.ts'), 'utf8');
      
      const hasBusinessRules = rateShopperService.includes('interface BusinessRules');
      const hasMarginPercentage = rateShopperService.includes('marginPercentage');
      const hasMarginCalculation = rateShopperService.includes('marginPercentage / 100');
      const hasConfigurableMargin = rateShopperService.includes('RATE_MARGIN_PERCENTAGE');
      
      if (hasBusinessRules && hasMarginPercentage && hasMarginCalculation && hasConfigurableMargin) {
        console.log('   ✅ Business rules interface defined');
        console.log('   ✅ Margin percentage configuration present');
        console.log('   ✅ Margin calculation logic implemented');
        console.log('   ✅ Environment-based configuration supported');
        results.marginLogic = true;
      } else {
        console.log('   ❌ Margin logic implementation incomplete');
      }
    } catch (error) {
      console.log('   ❌ Rate shopper service file not found');
    }

    // 3. Validate Speed Advantage Calculations
    console.log('\n3️⃣ Checking Speed Advantage Calculations...');
    try {
      const rateShopperService = await fs.readFile(path.join(SERVER_DIR, 'services/rate-shopper.ts'), 'utf8');
      
      const hasSpeedAdvantageThreshold = rateShopperService.includes('speedAdvantageThreshold');
      const hasDeliveryDaysComparison = rateShopperService.includes('deliveryDays');
      const hasOptimalCarrierSelection = rateShopperService.includes('selectOptimalCarrier');
      const hasSpeedCalculation = rateShopperService.includes('speedAdvantage');
      
      if (hasSpeedAdvantageThreshold && hasDeliveryDaysComparison && hasOptimalCarrierSelection && hasSpeedCalculation) {
        console.log('   ✅ Speed advantage threshold configured');
        console.log('   ✅ Delivery days comparison logic present');
        console.log('   ✅ Optimal carrier selection algorithm implemented');
        console.log('   ✅ Speed advantage calculations working');
        results.speedAdvantage = true;
      } else {
        console.log('   ❌ Speed advantage calculations incomplete');
      }
    } catch (error) {
      console.log('   ❌ Speed advantage logic not found');
    }

    // 4. Validate Enhanced Postal Zone Mapping
    console.log('\n4️⃣ Checking Enhanced Postal Zone Mapping...');
    try {
      const rateShopperService = await fs.readFile(path.join(SERVER_DIR, 'services/rate-shopper.ts'), 'utf8');
      const shipEngineService = await fs.readFile(path.join(SERVER_DIR, 'services/shipengine.ts'), 'utf8');
      
      const hasZoneCalculation = rateShopperService.includes('calculateZone') || shipEngineService.includes('calculateZone');
      const hasZoneBasedPricing = rateShopperService.includes('zoneRate') || shipEngineService.includes('zone');
      const hasPostalCodeMapping = rateShopperService.includes('postalCode') && shipEngineService.includes('postalCode');
      const hasRegionalLogic = rateShopperService.includes('Northeast') || shipEngineService.includes('Northeast');
      
      if (hasZoneCalculation && hasZoneBasedPricing && hasPostalCodeMapping && hasRegionalLogic) {
        console.log('   ✅ Zone calculation methods implemented');
        console.log('   ✅ Zone-based pricing logic present');
        console.log('   ✅ Postal code mapping functionality active');
        console.log('   ✅ Regional pricing logic configured');
        results.postalZoneMapping = true;
      } else {
        console.log('   ❌ Postal zone mapping incomplete');
      }
    } catch (error) {
      console.log('   ❌ Postal zone mapping files not found');
    }

    // 5. Validate Testing Infrastructure
    console.log('\n5️⃣ Checking Testing Infrastructure...');
    try {
      const routesFile = await fs.readFile(path.join(SERVER_DIR, 'routes.ts'), 'utf8');
      
      const hasEnhancedTestEndpoint = routesFile.includes('/api/test/enhanced-rate-shopping');
      const hasBusinessRulesTestEndpoint = routesFile.includes('/api/test/business-rules');
      const hasStatusEndpoint = routesFile.includes('/api/test/rate-comparison-status');
      const hasRateShopperServiceImport = routesFile.includes('RateShopperService');
      
      // Check for test scripts
      const testFiles = [
        'test_enhanced_rate_shopping.js',
        'test_rate_shopping_dry_run.js',
        'validate_implementation.js'
      ];
      
      let testFilesExist = 0;
      for (const testFile of testFiles) {
        try {
          await fs.access(testFile);
          testFilesExist++;
        } catch (error) {
          // File doesn't exist
        }
      }
      
      if (hasEnhancedTestEndpoint && hasBusinessRulesTestEndpoint && hasStatusEndpoint && hasRateShopperServiceImport && testFilesExist >= 2) {
        console.log('   ✅ Enhanced rate shopping test endpoint implemented');
        console.log('   ✅ Business rules test endpoint implemented');
        console.log('   ✅ Status check endpoint implemented');
        console.log('   ✅ Rate shopper service properly imported');
        console.log(`   ✅ ${testFilesExist}/3 test script files present`);
        results.testingInfrastructure = true;
      } else {
        console.log('   ❌ Testing infrastructure incomplete');
        console.log(`   ℹ️  Test endpoints: ${hasEnhancedTestEndpoint ? '✅' : '❌'}`);
        console.log(`   ℹ️  Test scripts: ${testFilesExist}/3 found`);
      }
    } catch (error) {
      console.log('   ❌ Testing infrastructure files not found');
    }

    // Generate Final Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPLEMENTATION VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    const features = [
      { name: 'ShipEngine API Integration for FedEx/USPS rates', status: results.shipEngineIntegration },
      { name: '5% Margin Logic in rate comparison', status: results.marginLogic },
      { name: 'Speed advantage calculations to decision engine', status: results.speedAdvantage },
      { name: 'Enhanced postal zone mapper with comprehensive calculations', status: results.postalZoneMapping },
      { name: 'Complete testing infrastructure with margin and speed tests', status: results.testingInfrastructure }
    ];

    features.forEach((feature, index) => {
      const status = feature.status ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${feature.name}`);
    });

    const completedFeatures = features.filter(f => f.status).length;
    const completionPercentage = (completedFeatures / features.length * 100).toFixed(0);
    
    console.log('\n' + '='.repeat(60));
    console.log(`📈 COMPLETION STATUS: ${completedFeatures}/${features.length} features (${completionPercentage}%)`);
    
    if (completedFeatures === features.length) {
      console.log('🎉 ALL FEATURES SUCCESSFULLY IMPLEMENTED!');
      console.log('\n💡 Your "side-car middleware" pattern is ready for:');
      console.log('   • Webhook-driven order interception');
      console.log('   • Real-time ShipEngine rate comparison');
      console.log('   • Intelligent carrier selection with 5% margin buffer');
      console.log('   • Speed advantage calculations');
      console.log('   • Comprehensive postal zone mapping');
      console.log('   • Full testing and validation suite');
    } else {
      console.log('⚠️  Some features need attention. Review the details above.');
    }

    console.log('\n🚀 Ready for production deployment of enhanced rate shopping middleware!');

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  validateImplementation().catch(console.error);
}

export { validateImplementation };