// Load environment variables
import { config } from 'dotenv';
config();

// Import required modules
import pg from 'pg';
const { Pool } = pg;

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Generate random ID
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// Simulate various middleware routing decisions
async function simulateMiddlewareDecisions() {
  console.log('🚀 Simulating middleware routing decisions...\n');
  
  const organizationId = 2; // Demo E-commerce Store (for demo client)
  const scenarios = [
    // Scenario 1: Quikpik is cheaper
    {
      orderId: `SS-${generateId()}`,
      orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
      destinationZip: '10001',
      weight: 1.5,
      quikpikRate: 3.89,
      fedexRate: 5.75,
      uspsRate: 4.95,
      routedTo: 'quikpik',
      reason: 'Quikpik rate is 32% cheaper than alternatives',
      alternativeCarrier: 'USPS',
      alternativeRate: 4.95,
      saved: 1.06
    },
    // Scenario 2: Quikpik within 5% margin
    {
      orderId: `SS-${generateId()}`,
      orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
      destinationZip: '90210',
      weight: 0.8,
      quikpikRate: 3.99,
      fedexRate: 3.85,
      uspsRate: 4.20,
      routedTo: 'quikpik',
      reason: 'Quikpik rate within 5% margin - chosen for speed advantage',
      alternativeCarrier: 'FedEx',
      alternativeRate: 3.85,
      saved: -0.14 // Negative savings but still chosen
    },
    // Scenario 3: Traditional carrier significantly cheaper
    {
      orderId: `SS-${generateId()}`,
      orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
      destinationZip: '98101',
      weight: 5.2,
      quikpikRate: 8.75,
      fedexRate: 6.25,
      uspsRate: 7.10,
      routedTo: 'fedex',
      reason: 'FedEx rate is 28% cheaper than Quikpik',
      alternativeCarrier: 'FedEx',
      alternativeRate: 6.25,
      saved: 0
    },
    // Scenario 4: Heavy package - Quikpik wins
    {
      orderId: `SS-${generateId()}`,
      orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
      destinationZip: '33139',
      weight: 12.5,
      quikpikRate: 15.99,
      fedexRate: 22.50,
      uspsRate: 19.95,
      routedTo: 'quikpik',
      reason: 'Quikpik rate is 29% cheaper for heavy package',
      alternativeCarrier: 'USPS',
      alternativeRate: 19.95,
      saved: 3.96
    },
    // Scenario 5: Zone 8 - Long distance
    {
      orderId: `SS-${generateId()}`,
      orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
      destinationZip: '99501', // Alaska
      weight: 2.0,
      quikpikRate: 7.85,
      fedexRate: 12.95,
      uspsRate: 9.50,
      routedTo: 'quikpik',
      reason: 'Quikpik offers best rate for Zone 8 delivery',
      alternativeCarrier: 'USPS',
      alternativeRate: 9.50,
      saved: 1.65
    },
    // Scenario 6: Small lightweight package
    {
      orderId: `SS-${generateId()}`,
      orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
      destinationZip: '60601',
      weight: 0.25,
      quikpikRate: 3.89,
      fedexRate: 3.95,
      uspsRate: 3.45,
      routedTo: 'usps',
      reason: 'USPS First Class is optimal for lightweight items',
      alternativeCarrier: 'USPS',
      alternativeRate: 3.45,
      saved: 0
    },
    // Scenario 7: Recent order - Quikpik wins again
    {
      orderId: `SS-${generateId()}`,
      orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
      destinationZip: '75201',
      weight: 3.2,
      quikpikRate: 5.25,
      fedexRate: 7.85,
      uspsRate: 6.50,
      routedTo: 'quikpik',
      reason: 'Quikpik rate is 19% cheaper than best alternative',
      alternativeCarrier: 'USPS',
      alternativeRate: 6.50,
      saved: 1.25
    },
    // Scenario 8: Express service comparison
    {
      orderId: `SS-${generateId()}`,
      orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
      destinationZip: '94105',
      weight: 1.0,
      quikpikRate: 4.99,
      fedexRate: 15.95, // FedEx Express
      uspsRate: 28.50, // USPS Express
      routedTo: 'quikpik',
      reason: 'Quikpik standard delivery beats express alternatives',
      alternativeCarrier: 'FedEx',
      alternativeRate: 15.95,
      saved: 10.96
    }
  ];
  
  // Insert all scenarios with staggered timestamps
  let timestamp = new Date();
  for (const scenario of scenarios) {
    // Subtract random minutes to create history
    timestamp = new Date(timestamp.getTime() - Math.random() * 30 * 60000);
    
    // Determine actual cost based on routing decision
    const actualCost = scenario.routedTo === 'quikpik' ? scenario.quikpikRate : scenario.alternativeRate;
    
    // Find cheapest traditional rate
    const cheapestTraditional = Math.min(scenario.fedexRate, scenario.uspsRate);
    
    await pool.query(`
      INSERT INTO middleware_analytics (
        organization_id, order_id, shipstation_order_id, destination_zip, weight,
        quikpik_rate, fedex_rate, usps_rate, routed_to, decision_reason,
        cheapest_traditional, actual_cost, alternative_cost, saved_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      organizationId,
      Math.floor(Math.random() * 1000) + 100, // order_id (integer)
      scenario.orderId, // shipstation_order_id (string)
      scenario.destinationZip,
      scenario.weight,
      scenario.quikpikRate,
      scenario.fedexRate,
      scenario.uspsRate,
      scenario.routedTo,
      scenario.reason,
      cheapestTraditional,
      actualCost,
      scenario.alternativeRate,
      scenario.saved
    ]);
    
    console.log(`✅ Created ${scenario.routedTo} routing decision for Order ${scenario.orderNumber}`);
    console.log(`   → ${scenario.reason}`);
    console.log(`   → Quikpik: $${scenario.quikpikRate.toFixed(2)} vs ${scenario.alternativeCarrier}: $${scenario.alternativeRate.toFixed(2)}`);
    if (scenario.saved > 0) {
      console.log(`   → Saved: $${scenario.saved.toFixed(2)}`);
    }
    console.log('');
  }
  
  // Calculate summary stats
  const quikpikCount = scenarios.filter(s => s.routedTo === 'quikpik').length;
  const totalSaved = scenarios.reduce((sum, s) => sum + (s.saved > 0 ? s.saved : 0), 0);
  const captureRate = (quikpikCount / scenarios.length) * 100;
  
  console.log('📊 Summary Statistics:');
  console.log(`   → Total Orders Processed: ${scenarios.length}`);
  console.log(`   → Routed to Quikpik: ${quikpikCount}`);
  console.log(`   → Routed to Traditional: ${scenarios.length - quikpikCount}`);
  console.log(`   → Total Saved: $${totalSaved.toFixed(2)}`);
  console.log(`   → Capture Rate: ${captureRate.toFixed(1)}%`);
  console.log('\n✨ Middleware simulation complete! Check your dashboard to see the analytics.');
}

// Run the simulation
simulateMiddlewareDecisions()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    pool.end();
    process.exit(1);
  });