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

// Placeholder customer rate structure - will be updated with your actual rates
const CUSTOMER_RATE_ZONES: CustomerRateConfig[] = [
  {
    zone: 1,
    weightRanges: [
      { minKg: 0, maxKg: 0.5, baseRate: 5.99 },
      { minKg: 0.5, maxKg: 1.0, baseRate: 7.99 },
      { minKg: 1.0, maxKg: 2.0, baseRate: 9.99, perKgRate: 2.00 }
    ]
  },
  {
    zone: 3, 
    weightRanges: [
      { minKg: 0, maxKg: 0.5, baseRate: 6.99 },
      { minKg: 0.5, maxKg: 1.0, baseRate: 8.99 },
      { minKg: 1.0, maxKg: 2.0, baseRate: 11.99, perKgRate: 2.50 }
    ]
  },
  {
    zone: 5,
    weightRanges: [
      { minKg: 0, maxKg: 0.5, baseRate: 7.99 },
      { minKg: 0.5, maxKg: 1.0, baseRate: 9.99 },
      { minKg: 1.0, maxKg: 2.0, baseRate: 13.99, perKgRate: 3.00 }
    ]
  },
  {
    zone: 8,
    weightRanges: [
      { minKg: 0, maxKg: 0.5, baseRate: 8.99 },
      { minKg: 0.5, maxKg: 1.0, baseRate: 12.99 }, // Higher than internal $4.84
      { minKg: 1.0, maxKg: 2.0, baseRate: 16.99, perKgRate: 4.00 }
    ]
  }
];

export class CustomerRateService {
  /**
   * Calculate customer-facing rate for given zone and weight
   */
  calculateCustomerRate(zone: number, weightKg: number): number | null {
    const zoneConfig = CUSTOMER_RATE_ZONES.find(z => z.zone === zone);
    if (!zoneConfig) {
      return null;
    }

    // Find applicable weight range
    const weightRange = zoneConfig.weightRanges.find(range => 
      weightKg >= range.minKg && weightKg < range.maxKg
    );

    if (!weightRange) {
      // Use the highest range if weight exceeds all ranges
      const highestRange = zoneConfig.weightRanges[zoneConfig.weightRanges.length - 1];
      if (weightKg >= highestRange.minKg && highestRange.perKgRate) {
        const excessWeight = weightKg - highestRange.minKg;
        return highestRange.baseRate + (excessWeight * highestRange.perKgRate);
      }
      return null;
    }

    // Calculate rate based on weight range
    if (weightRange.perKgRate && weightKg > weightRange.minKg) {
      const excessWeight = weightKg - weightRange.minKg;
      return weightRange.baseRate + (excessWeight * weightRange.perKgRate);
    }

    return weightRange.baseRate;
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
   * Update customer rate configuration
   * This will be used when you provide the actual rate sheet
   */
  updateRateConfig(newRates: CustomerRateConfig[]): void {
    // TODO: Implement rate config update
    console.log('Customer rates will be updated with:', newRates);
  }
}