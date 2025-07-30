import { ShipStationService } from './shipstation';
import { ShipEngineService } from './shipengine';
import { EnhancedJiayouService } from './enhanced-jiayou';
import { storage } from '../storage';

export interface RateComparison {
  orderId: string;
  quikpikRate: {
    carrier: 'quikpik';
    cost: number;
    deliveryDays: string;
    service: string;
  };
  competitorRates: Array<{
    carrier: string;
    cost: number;
    deliveryDays: string;
    service: string;
    carrierCode: string;
    serviceCode: string;
  }>;
  winner: {
    carrier: string;
    cost: number;
    savings: number;
    savingsPercentage: number;
  };
  timestamp: Date;
}

export interface ShipmentResult {
  success: boolean;
  carrier: string;
  trackingNumber?: string;
  labelUrl?: string;
  cost: number;
  error?: string;
}

interface BusinessRules {
  marginPercentage: number;
  maxWeightLbs: number;
  maxDimensions: { length: number; width: number; height: number };
  speedAdvantageThreshold: number; // days
  minSavingsThreshold: number; // dollars
}

export class RateShopperService {
  private shipStationService: ShipStationService;
  private shipEngineService: ShipEngineService;
  private jiayouService: EnhancedJiayouService;
  private businessRules: BusinessRules;

  constructor() {
    this.shipStationService = new ShipStationService();
    this.shipEngineService = new ShipEngineService();
    this.jiayouService = new EnhancedJiayouService();
    
    // Configure business rules from environment or defaults
    this.businessRules = {
      marginPercentage: parseFloat(process.env.RATE_MARGIN_PERCENTAGE || '5'), // 5% buffer
      maxWeightLbs: parseFloat(process.env.MAX_WEIGHT_LBS || '50'), // 50 lbs max
      maxDimensions: {
        length: parseFloat(process.env.MAX_LENGTH_INCHES || '24'),
        width: parseFloat(process.env.MAX_WIDTH_INCHES || '18'), 
        height: parseFloat(process.env.MAX_HEIGHT_INCHES || '12')
      },
      speedAdvantageThreshold: parseInt(process.env.SPEED_ADVANTAGE_THRESHOLD || '2'), // 2 days faster
      minSavingsThreshold: parseFloat(process.env.MIN_SAVINGS_THRESHOLD || '1.00') // $1 minimum savings
    };
  }

  /**
   * Compare rates between Quikpik and competitors with business rules
   */
  async compareRates(orderData: any): Promise<RateComparison> {
    const orderId = orderData.orderNumber || orderData.orderId?.toString();
    
    try {
      // Check if order qualifies for Quikpik (weight/size limits)
      const isEligible = this.checkQuikpikEligibility(orderData);
      console.log(`Order ${orderId} Quikpik eligibility:`, isEligible);
      
      // Get Quikpik rates via Jiayou
      const quikpikQuote = await this.getQuikpikRate(orderData);
      
      // Get competitor rates via ShipEngine (FedEx, USPS, UPS)
      const competitorRatesData = await this.getCompetitorRates(orderData);
      
      // Apply margin logic to competitor rates for fair comparison
      const adjustedCompetitorRates = competitorRatesData.map(rate => ({
        ...rate,
        originalCost: rate.cost,
        cost: rate.cost * (1 + this.businessRules.marginPercentage / 100) // Add margin buffer
      }));

      const allRates = [
        {
          carrier: 'quikpik',
          cost: quikpikQuote.cost,
          deliveryDays: quikpikQuote.deliveryDays,
          service: quikpikQuote.service,
          carrierCode: 'quikpik',
          serviceCode: 'standard',
          estimatedDeliveryDate: this.calculateQuikpikDeliveryDate()
        },
        ...adjustedCompetitorRates
      ];

      // Apply intelligent decision logic
      const winner = this.selectOptimalCarrier(allRates, isEligible);
      
      const quikpikRate = allRates.find(r => r.carrier === 'quikpik')!;
      const competitorRates = allRates.filter(r => r.carrier !== 'quikpik');
      
      const cheapestCompetitor = competitorRates.length > 0 
        ? competitorRates.reduce((prev, current) => prev.cost < current.cost ? prev : current)
        : null;

      const savings = cheapestCompetitor 
        ? cheapestCompetitor.cost - winner.cost 
        : 0;
      
      const savingsPercentage = cheapestCompetitor && cheapestCompetitor.cost > 0
        ? (savings / cheapestCompetitor.cost) * 100
        : 0;

      const comparison: RateComparison = {
        orderId,
        quikpikRate: {
          carrier: 'quikpik',
          cost: quikpikRate.cost,
          deliveryDays: quikpikRate.deliveryDays,
          service: quikpikRate.service
        },
        competitorRates: competitorRatesData, // Store original rates for display
        winner: {
          carrier: winner.carrier,
          cost: winner.cost,
          savings,
          savingsPercentage
        },
        timestamp: new Date()
      };

      // Store the rate comparison for analytics
      await this.storeRateComparison(comparison);

      console.log(`Order ${orderId} rate comparison result:`, {
        quikpik: quikpikRate.cost,
        cheapestCompetitor: cheapestCompetitor?.cost,
        winner: winner.carrier,
        savings: savings.toFixed(2),
        marginApplied: `${this.businessRules.marginPercentage}%`
      });

      return comparison;

    } catch (error) {
      console.error('Rate comparison failed:', error);
      throw new Error(`Failed to compare rates for order ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create shipment with the winning carrier
   */
  async createShipment(orderData: any, rateComparison: RateComparison): Promise<ShipmentResult> {
    const winner = rateComparison.winner;

    try {
      if (winner.carrier === 'quikpik') {
        return await this.createQuikpikShipment(orderData, rateComparison);
      } else {
        return await this.createShipStationShipment(orderData, rateComparison);
      }
    } catch (error) {
      console.error(`Shipment creation failed for ${winner.carrier}:`, error);
      return {
        success: false,
        carrier: winner.carrier,
        cost: winner.cost,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getQuikpikRate(orderData: any): Promise<{cost: number, deliveryDays: string, service: string}> {
    try {
      // Use existing Jiayou service to get Quikpik rates
      const shipTo = orderData.shipTo;
      const weight = this.calculateTotalWeight(orderData.items);
      
      // Mock Quikpik rate calculation - replace with your actual rate API
      const baseRate = 8.50;
      const weightRate = Math.max(0, (weight - 1) * 2.00);
      const zoneRate = this.calculateZoneRate(shipTo.postalCode);
      
      return {
        cost: baseRate + weightRate + zoneRate,
        deliveryDays: '2-3',
        service: 'Quikpik Standard'
      };
    } catch (error) {
      console.error('Failed to get Quikpik rate:', error);
      return {
        cost: 999.99, // High cost to exclude from competition if rate fails
        deliveryDays: 'N/A',
        service: 'Rate Error'
      };
    }
  }

  private async getCompetitorRates(orderData: any): Promise<Array<{
    carrier: string;
    cost: number;
    deliveryDays: string;
    service: string;
    carrierCode: string;
    serviceCode: string;
    estimatedDeliveryDate?: string;
  }>> {
    try {
      // Call ShipEngine API for FedEx, USPS, UPS rates
      const rates = await this.shipEngineService.getRates({
        fromAddress: {
          name: process.env.ORIGIN_NAME || 'Quikpik Fulfillment',
          street1: process.env.ORIGIN_ADDRESS || '123 Main St',
          city: process.env.ORIGIN_CITY || 'Los Angeles',
          state: process.env.ORIGIN_STATE || 'CA',
          postalCode: process.env.ORIGIN_POSTAL_CODE || '90210',
          country: 'US'
        },
        toAddress: {
          name: orderData.shipTo.name,
          street1: orderData.shipTo.street1,
          city: orderData.shipTo.city,
          state: orderData.shipTo.state,
          postalCode: orderData.shipTo.postalCode,
          country: orderData.shipTo.country || 'US'
        },
        weight: this.calculateTotalWeight(orderData.items),
        dimensions: {
          length: 12,
          width: 9,
          height: 3
        },
        carrierCodes: ['fedex', 'usps', 'ups']
      });

      return this.shipEngineService.formatRatesForComparison(rates);

    } catch (error) {
      console.error('Failed to get ShipEngine rates:', error);
      // Return fallback rates so comparison doesn't fail completely
      return [
        {
          carrier: 'USPS',
          cost: 12.50,
          deliveryDays: '3-5',
          service: 'Ground Advantage',
          carrierCode: 'usps',
          serviceCode: 'usps_ground_advantage',
          estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          carrier: 'FedEx',
          cost: 15.75,
          deliveryDays: '2-3',
          service: 'Ground',
          carrierCode: 'fedex',
          serviceCode: 'fedex_ground',
          estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          carrier: 'UPS',
          cost: 14.25,
          deliveryDays: '2-4',
          service: 'Ground',
          carrierCode: 'ups',
          serviceCode: 'ups_ground',
          estimatedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
  }

  private async createQuikpikShipment(orderData: any, rateComparison: RateComparison): Promise<ShipmentResult> {
    try {
      // Create shipment via Jiayou/Quikpik API
      const shipmentResult = await this.jiayouService.createShipment({
        to: orderData.shipTo,
        from: {
          name: process.env.ORIGIN_NAME || 'Quikpik Fulfillment',
          street1: process.env.ORIGIN_ADDRESS || '123 Main St',
          city: process.env.ORIGIN_CITY || 'Los Angeles',
          state: process.env.ORIGIN_STATE || 'CA',
          postalCode: process.env.ORIGIN_POSTAL_CODE || '90210',
          country: 'US'
        },
        parcel: {
          length: 12,
          width: 9,
          height: 3,
          weight: this.calculateTotalWeight(orderData.items)
        },
        service: 'standard'
      });

      return {
        success: true,
        carrier: 'quikpik',
        trackingNumber: shipmentResult.trackingNumber,
        labelUrl: shipmentResult.labelUrl,
        cost: rateComparison.winner.cost
      };

    } catch (error) {
      console.error('Quikpik shipment creation failed:', error);
      throw error;
    }
  }

  private async createShipStationShipment(orderData: any, rateComparison: RateComparison): Promise<ShipmentResult> {
    try {
      const winningRate = rateComparison.competitorRates.find(r => 
        r.carrier === rateComparison.winner.carrier
      );
      
      if (!winningRate) {
        throw new Error('Winning rate not found in competitor rates');
      }

      // Create label via ShipStation API
      const labelResult = await this.shipStationService.createLabel({
        orderId: orderData.orderId,
        carrierCode: winningRate.carrierCode,
        serviceCode: winningRate.serviceCode,
        packageCode: 'package',
        confirmation: 'none',
        shipDate: new Date().toISOString().split('T')[0]
      });

      return {
        success: true,
        carrier: rateComparison.winner.carrier,
        trackingNumber: labelResult.trackingNumber,
        labelUrl: labelResult.labelData,
        cost: rateComparison.winner.cost
      };

    } catch (error) {
      console.error('ShipStation shipment creation failed:', error);
      throw error;
    }
  }

  private async storeRateComparison(comparison: RateComparison): Promise<void> {
    try {
      // Store in database for analytics dashboard
      await storage.createRateComparison({
        organizationId: 1, // TODO: Get from order context
        orderId: comparison.orderId,
        quikpikCost: comparison.quikpikRate.cost.toString(),
        competitorCosts: comparison.competitorRates.map(r => ({
          carrier: r.carrier,
          cost: r.cost,
          service: r.service
        })),
        winningCarrier: comparison.winner.carrier,
        winningCost: comparison.winner.cost.toString(),
        savings: comparison.winner.savings.toString(),
        savingsPercentage: comparison.winner.savingsPercentage.toString(),
        timestamp: comparison.timestamp
      });
    } catch (error) {
      console.error('Failed to store rate comparison:', error);
      // Don't throw - this is just for analytics
    }
  }

  private calculateTotalWeight(items: any[]): number {
    if (!items || items.length === 0) return 8; // Default weight in ounces
    
    return items.reduce((total, item) => {
      const itemWeight = item.weight?.value || 4; // Default 4oz per item
      const quantity = item.quantity || 1;
      return total + (itemWeight * quantity);
    }, 0);
  }

  private calculateZoneRate(postalCode: string): number {
    // Simple zone-based pricing - customize based on your zones
    const zone = parseInt(postalCode.charAt(0));
    if (zone <= 3) return 0; // Local zones
    if (zone <= 6) return 1.50; // Regional zones  
    return 3.00; // National zones
  }

  /**
   * Check if order qualifies for Quikpik based on business rules
   */
  private checkQuikpikEligibility(orderData: any): {eligible: boolean, reasons: string[]} {
    const reasons: string[] = [];
    let eligible = true;

    // Check weight limits
    const totalWeight = this.calculateTotalWeight(orderData.items) / 16; // Convert to lbs
    if (totalWeight > this.businessRules.maxWeightLbs) {
      eligible = false;
      reasons.push(`Weight ${totalWeight.toFixed(1)} lbs exceeds limit of ${this.businessRules.maxWeightLbs} lbs`);
    }

    // Check dimension limits (simplified - would need actual package dimensions)
    const estimatedDimensions = this.estimatePackageDimensions(orderData.items);
    if (estimatedDimensions.length > this.businessRules.maxDimensions.length ||
        estimatedDimensions.width > this.businessRules.maxDimensions.width ||
        estimatedDimensions.height > this.businessRules.maxDimensions.height) {
      eligible = false;
      reasons.push(`Package dimensions exceed limits`);
    }

    // Check zone restrictions (could add specific postal codes that are restricted)
    const zone = this.calculateZone(orderData.shipTo?.postalCode || '90210');
    if (zone > 6) {
      eligible = false;
      reasons.push(`Delivery zone ${zone} not serviced`);
    }

    return { eligible, reasons };
  }

  /**
   * Select optimal carrier using intelligent decision logic
   */
  private selectOptimalCarrier(allRates: any[], isEligible: {eligible: boolean, reasons: string[]}): any {
    // If not eligible for Quikpik, select cheapest competitor
    if (!isEligible.eligible) {
      console.log('Quikpik not eligible, selecting cheapest competitor:', isEligible.reasons);
      const competitors = allRates.filter(r => r.carrier !== 'quikpik');
      return competitors.reduce((prev, current) => prev.cost < current.cost ? prev : current);
    }

    const quikpikRate = allRates.find(r => r.carrier === 'quikpik')!;
    const competitors = allRates.filter(r => r.carrier !== 'quikpik');
    const cheapestCompetitor = competitors.reduce((prev, current) => 
      prev.cost < current.cost ? prev : current
    );

    // Calculate potential savings
    const savings = cheapestCompetitor.cost - quikpikRate.cost;

    // Check minimum savings threshold
    if (savings < this.businessRules.minSavingsThreshold) {
      console.log(`Savings $${savings.toFixed(2)} below threshold $${this.businessRules.minSavingsThreshold}, selecting competitor`);
      return cheapestCompetitor;
    }

    // Check speed advantage
    const quikpikDays = parseInt(quikpikRate.deliveryDays.split('-')[0]) || 2;
    const competitorDays = parseInt(cheapestCompetitor.deliveryDays.split('-')[0]) || 3;
    const speedAdvantage = competitorDays - quikpikDays;

    if (speedAdvantage >= this.businessRules.speedAdvantageThreshold) {
      console.log(`Quikpik ${speedAdvantage} days faster + $${savings.toFixed(2)} savings = WINNER`);
      return quikpikRate;
    }

    // If speed advantage is minimal but savings exist, still choose Quikpik
    if (savings > 0) {
      console.log(`Quikpik saves $${savings.toFixed(2)} with similar speed = WINNER`);
      return quikpikRate;  
    }

    // Fallback to cheapest
    console.log('No clear advantage, selecting cheapest option');
    return allRates.reduce((prev, current) => prev.cost < current.cost ? prev : current);
  }

  /**
   * Calculate estimated Quikpik delivery date
   */
  private calculateQuikpikDeliveryDate(): string {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 2); // Quikpik standard 2-day delivery
    return deliveryDate.toISOString();
  }

  /**
   * Estimate package dimensions based on items
   */
  private estimatePackageDimensions(items: any[]): {length: number, width: number, height: number} {
    const itemCount = items?.reduce((total, item) => total + (item.quantity || 1), 0) || 1;
    
    // Simple estimation - would be more sophisticated in production
    if (itemCount <= 2) return { length: 10, width: 8, height: 4 };
    if (itemCount <= 5) return { length: 12, width: 10, height: 6 };
    return { length: 16, width: 12, height: 8 };
  }

  /**
   * Calculate shipping zone from postal code  
   */
  private calculateZone(postalCode: string): number {
    const firstDigit = parseInt(postalCode.charAt(0)) || 9;
    if (firstDigit <= 1) return 2; // Northeast
    if (firstDigit <= 3) return 3; // Southeast  
    if (firstDigit <= 6) return 4; // Central
    if (firstDigit <= 8) return 5; // Mountain
    return 6; // Pacific
  }

  private mapCarrierName(carrierCode: string): string {
    const carrierMap: { [key: string]: string } = {
      'fedex': 'FedEx',
      'ups': 'UPS', 
      'usps': 'USPS',
      'dhl_express': 'DHL',
      'dhl': 'DHL',
      'ontrac': 'OnTrac',
      'lasership': 'LaserShip'
    };
    
    return carrierMap[carrierCode.toLowerCase()] || carrierCode.toUpperCase();
  }
}