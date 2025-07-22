/**
 * Customer Rate Calculator
 * Calculates customer-facing rates (higher than internal Jiayou rates)
 */

interface CustomerRateConfig {
  zone: number;
  weightRanges: {
    minKg: number;
    maxKg: number;
    baseRate: number;
    perKgRate?: number;
  }[];
}

// Quikpik Customer Rate Table - from provided rate sheet
const QUIKPIK_RATE_TABLE: { [zone: number]: { [weightLbs: number]: number } } = {
  0: { // Zone 0 | Pickups
    0.25: 0.99, 0.44: 0.99, 0.625: 0.99, 1: 0.99, 1.65: 0.99, 2.2: 0.99
    // 3.3+ are NA for Zone 0
  },
  1: { // Zone 1
    0.25: 2.84, 0.44: 2.95, 0.625: 3.00, 1: 3.25, 1.65: 3.67, 2.2: 3.67,
    3.3: 3.67, 4.4: 3.67, 5.5: 3.83, 6.6: 4.08, 7.7: 4.08, 8.8: 4.08,
    9.9: 4.08, 11: 5.57, 12.1: 5.57, 13.2: 5.57, 14.3: 5.57, 15.4: 5.57,
    16.5: 5.57, 17.6: 5.57, 18.7: 5.57, 19.8: 5.57
  },
  2: { // Zone 2
    0.25: 2.87, 0.44: 3.00, 0.625: 3.00, 1: 3.25, 1.65: 3.91, 2.2: 3.91,
    3.3: 3.91, 4.4: 3.91, 5.5: 4.08, 6.6: 4.08, 7.7: 4.08, 8.8: 4.08,
    9.9: 4.08, 11: 6.55, 12.1: 6.55, 13.2: 6.55, 14.3: 6.55, 15.4: 6.55,
    16.5: 6.55, 17.6: 6.55, 18.7: 6.55, 19.8: 6.55
  },
  3: { // Zone 3
    0.25: 2.89, 0.44: 3.00, 0.625: 3.25, 1: 3.67, 1.65: 4.15, 2.2: 4.15,
    3.3: 4.15, 4.4: 4.15, 5.5: 4.33, 6.6: 4.33, 7.7: 4.33, 8.8: 4.33,
    9.9: 4.33, 11: 7.85, 12.1: 7.85, 13.2: 7.85, 14.3: 7.85, 15.4: 7.85,
    16.5: 7.85, 17.6: 7.85, 18.7: 7.85, 19.8: 7.85
  },
  4: { // Zone 4
    0.25: 2.89, 0.44: 3.06, 0.625: 3.25, 1: 3.67, 1.65: 4.27, 2.2: 4.27,
    3.3: 4.27, 4.4: 4.27, 5.5: 4.45, 6.6: 5.81, 7.7: 5.81, 8.8: 5.81,
    9.9: 5.81, 11: 8.04, 12.1: 8.04, 13.2: 8.04, 14.3: 8.04, 15.4: 8.04,
    16.5: 8.04, 17.6: 8.04, 18.7: 8.04, 19.8: 8.04
  },
  5: { // Zone 5
    0.25: 2.92, 0.44: 3.34, 0.625: 3.80, 1: 4.23, 1.65: 4.68, 2.2: 4.74,
    3.3: 4.80, 4.4: 4.92, 5.5: 5.27, 6.6: 6.55, 7.7: 6.55, 8.8: 6.55,
    9.9: 6.55, 11: 8.16, 12.1: 8.16, 13.2: 8.16, 14.3: 8.16, 15.4: 8.20,
    16.5: 8.27, 17.6: 8.58, 18.7: 8.93, 19.8: 9.32
  },
  6: { // Zone 6
    0.25: 2.99, 0.44: 3.40, 0.625: 3.84, 1: 4.59, 1.65: 4.80, 2.2: 4.86,
    3.3: 4.92, 4.4: 4.99, 5.5: 5.34, 6.6: 6.80, 7.7: 6.80, 8.8: 6.80,
    9.9: 6.80, 11: 8.16, 12.1: 8.16, 13.2: 8.16, 14.3: 8.27, 15.4: 8.65,
    16.5: 8.72, 17.6: 9.05, 18.7: 9.42, 19.8: 9.84
  },
  7: { // Zone 7
    0.25: 2.99, 0.44: 3.40, 0.625: 3.84, 1: 4.59, 1.65: 4.80, 2.2: 4.86,
    3.3: 4.92, 4.4: 4.99, 5.5: 5.34, 6.6: 7.04, 7.7: 7.04, 8.8: 7.04,
    9.9: 7.04, 11: 8.16, 12.1: 8.16, 13.2: 8.16, 14.3: 8.27, 15.4: 8.65,
    16.5: 8.72, 17.6: 9.05, 18.7: 9.42, 19.8: 9.84
  },
  8: { // Zone 8
    0.25: 3.55, 0.44: 3.97, 0.625: 4.41, 1: 4.98, 1.65: 5.75, 2.2: 5.75,
    3.3: 5.75, 4.4: 5.98, 5.5: 6.24, 6.6: 7.16, 7.7: 7.16, 8.8: 7.16,
    9.9: 7.16, 11: 11.62, 12.1: 11.92, 13.2: 12.22, 14.3: 12.48, 15.4: 12.74,
    16.5: 13.07, 17.6: 13.26, 18.7: 13.57, 19.8: 13.85
  }
};

export class CustomerRateService {
  /**
   * Calculate customer-facing rate for given zone and weight using Quikpik rate table
   */
  calculateCustomerRate(zone: number, weightKg: number): number | null {
    const zoneRates = QUIKPIK_RATE_TABLE[zone];
    if (!zoneRates) {
      return null;
    }

    // Convert kg to lbs for rate lookup
    const weightLbs = weightKg * 2.20462;
    
    // Define weight breakpoints in lbs (from rate table)
    const weightBreakpoints = [0.25, 0.44, 0.625, 1, 1.65, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9, 11, 12.1, 13.2, 14.3, 15.4, 16.5, 17.6, 18.7, 19.8];
    
    // Find the appropriate weight bracket
    let applicableWeight = 0.25; // Default to smallest weight
    
    for (let i = 0; i < weightBreakpoints.length; i++) {
      if (weightLbs <= weightBreakpoints[i]) {
        applicableWeight = weightBreakpoints[i];
        break;
      }
      // If weight exceeds current breakpoint, continue to next
      if (i === weightBreakpoints.length - 1) {
        // Weight exceeds all breakpoints, use the highest
        applicableWeight = weightBreakpoints[i];
      }
    }
    
    // Get rate for this weight bracket and zone
    const rate = zoneRates[applicableWeight];
    
    // Handle Zone 0 special case (NA for higher weights)
    if (zone === 0 && applicableWeight > 2.2) {
      return null; // Zone 0 doesn't support heavy packages
    }
    
    return rate || null;
  }

  /**
   * Get profit margin between internal and customer rates
   */
  calculateProfitMargin(internalRate: number, customerRate: number): {
    amount: number;
    percentage: number;
  } {
    const margin = customerRate - internalRate;
    const percentage = (margin / internalRate) * 100;
    
    return {
      amount: margin,
      percentage: percentage
    };
  }

  /**
   * Get all available zones
   */
  getAvailableZones(): number[] {
    return Object.keys(QUIKPIK_RATE_TABLE).map(zone => parseInt(zone));
  }

  /**
   * Check if zone supports given weight
   */
  isWeightSupportedInZone(zone: number, weightKg: number): boolean {
    const rate = this.calculateCustomerRate(zone, weightKg);
    return rate !== null;
  }
}