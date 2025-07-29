import { ShipStationService } from './shipstation';
import { JiayouService } from './jiayou';
import { shipEngineService, ShipEngineService } from './shipengine';
import { CustomerRateService } from './customer-rates';

interface RoutingDecision {
  useQuikpik: boolean;
  reason: string;
  quikpikRate?: number;
  competitorRate?: number;
  savings?: number;
  carrierUsed?: string;
}

interface OrderProcessingResult {
  success: boolean;
  decision: RoutingDecision;
  trackingNumber?: string;
  labelUrl?: string;
  error?: string;
}

export class MiddlewareEngine {
  private shipStationService: ShipStationService;
  private jiayouService: JiayouService;
  private shipEngineService: ShipEngineService;
  private customerRateService: CustomerRateService;

  constructor() {
    this.shipStationService = new ShipStationService();
    this.jiayouService = new JiayouService();
    this.shipEngineService = shipEngineService;
    this.customerRateService = new CustomerRateService();
  }

  /**
   * Main middleware decision engine
   * Compare Quikpik vs competitor rates and route shipment
   */
  async processOrder(shipStationOrderId: number): Promise<OrderProcessingResult> {
    try {
      console.log(`\n🚀 Middleware processing order ${shipStationOrderId}`);

      // Step 1: Get order from ShipStation
      const order = await this.shipStationService.getOrder(shipStationOrderId);
      if (!order) {
        return {
          success: false,
          decision: { useQuikpik: false, reason: 'Order not found in ShipStation' },
          error: 'Order not found'
        };
      }

      console.log(`📦 Processing order ${order.orderNumber} to ${order.shipTo?.city}, ${order.shipTo?.state}`);

      // Step 2: Get Quikpik rate
      const quikpikRate = await this.getQuikpikRate(order);
      console.log(`💰 Quikpik rate: $${quikpikRate ? quikpikRate.toFixed(2) : 'N/A'}`);

      // Step 3: Get competitor rates
      const competitorRates = await this.getCompetitorRates(order);
      const cheapestCompetitor = competitorRates.length > 0 
        ? Math.min(...competitorRates.map(r => r.shipping_amount.amount))
        : null;
      
      console.log(`💰 Best competitor rate: $${cheapestCompetitor ? cheapestCompetitor.toFixed(2) : 'N/A'}`);

      // Step 4: Make routing decision
      const decision = this.makeRoutingDecision(quikpikRate, cheapestCompetitor, competitorRates);
      console.log(`🎯 Decision: ${decision.useQuikpik ? 'Use Quikpik' : 'Use competitor'} - ${decision.reason}`);

      // Store analytics data for transparency
      try {
        const { storage } = await import('../storage');
        const { postalZoneMapper } = await import('./postal-zone-mapper');
        
        const zone = order.shipTo?.postalCode ? postalZoneMapper.getZone(order.shipTo.postalCode) : null;
        const totalWeight = order.items?.reduce((sum: number, item: any) => {
          const itemWeight = item.weight?.value || 0;
          const quantity = item.quantity || 1;
          return sum + (itemWeight * quantity);
        }, 0) || 8;

        // Find specific carrier rates
        const fedexRate = competitorRates.find(r => r.carrier_code === 'fedex')?.shipping_amount?.amount;
        const uspsRate = competitorRates.find(r => r.carrier_code === 'usps')?.shipping_amount?.amount;
        
        const analyticsData = {
          organizationId: order.organizationId || 8, // Default to Trend 36 for now
          orderId: order.id || null,
          shipstationOrderId: order.orderNumber || String(shipStationOrderId),
          routedTo: decision.useQuikpik ? 'quikpik' : 'traditional',
          decisionReason: decision.reason,
          quikpikRate: quikpikRate ? quikpikRate.toFixed(2) : null,
          fedexRate: fedexRate ? fedexRate.toFixed(2) : null,
          uspsRate: uspsRate ? uspsRate.toFixed(2) : null,
          cheapestTraditional: cheapestCompetitor ? cheapestCompetitor.toFixed(2) : null,
          actualCost: (decision.useQuikpik ? quikpikRate : cheapestCompetitor)?.toFixed(2) || '0.00',
          alternativeCost: (decision.useQuikpik ? cheapestCompetitor : quikpikRate)?.toFixed(2) || '0.00',
          savedAmount: (decision.savings || 0).toFixed(2),
          weight: totalWeight.toFixed(2),
          destinationZip: order.shipTo?.postalCode || null,
          shippingZone: zone
        };
        
        await storage.createMiddlewareAnalytics(analyticsData);
        console.log('✅ Analytics data stored for transparency');
      } catch (error) {
        console.error('Failed to store analytics:', error);
      }

      // Step 5: Execute the decision
      if (decision.useQuikpik && quikpikRate) {
        return await this.executeQuikpikShipment(order, decision);
      } else {
        return await this.executeCompetitorShipment(order, decision);
      }

    } catch (error) {
      console.error('Middleware processing error:', error);
      return {
        success: false,
        decision: { useQuikpik: false, reason: 'Processing error' },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get Quikpik rate for the order
   */
  private async getQuikpikRate(order: any): Promise<number | null> {
    try {
      if (!order.shipTo?.postalCode) return null;

      // Calculate weight
      let totalWeight = 0;
      if (order.items && Array.isArray(order.items)) {
        totalWeight = order.items.reduce((sum: number, item: any) => {
          const itemWeight = item.weight?.value || 0;
          const quantity = item.quantity || 1;
          return sum + (itemWeight * quantity);
        }, 0);
      }

      // Default to 8 oz if no weight
      if (totalWeight === 0) totalWeight = 8;

      // Get Quikpik customer rate based on postal code zone
      const { postalZoneMapper } = await import('./postal-zone-mapper');
      const zone = postalZoneMapper.getZone(order.shipTo.postalCode);
      const weightInKg = totalWeight * 0.0283495; // Convert oz to kg
      const customerRate = this.customerRateService.calculateCustomerRate(zone, weightInKg);
      
      console.log(`Quikpik rate calculation: ZIP ${order.shipTo.postalCode} → Zone ${zone}, ${totalWeight}oz (${weightInKg.toFixed(3)}kg) → $${customerRate}`);
      return customerRate;

    } catch (error) {
      console.error('Error getting Quikpik rate:', error);
      return null;
    }
  }

  /**
   * Get competitor rates via ShipEngine
   */
  private async getCompetitorRates(order: any): Promise<any[]> {
    try {
      const rateRequest = this.shipEngineService.convertShipStationOrder(order);
      const rates = await this.shipEngineService.getRates(rateRequest);
      
      // Filter for FedEx and USPS only
      return this.shipEngineService.getCarrierRates(rates, ['fedex', 'usps']);
    } catch (error) {
      console.error('Error getting competitor rates:', error);
      return [];
    }
  }

  /**
   * Make routing decision based on rates and business rules
   */
  private makeRoutingDecision(
    quikpikRate: number | null, 
    competitorRate: number | null,
    competitorRates: any[]
  ): RoutingDecision {
    // If no Quikpik rate available, use competitor
    if (!quikpikRate) {
      return {
        useQuikpik: false,
        reason: 'Quikpik rate not available',
        competitorRate: competitorRate || undefined
      };
    }

    // If no competitor rates, use Quikpik
    if (!competitorRate || competitorRates.length === 0) {
      return {
        useQuikpik: true,
        reason: 'No competitor rates available',
        quikpikRate: quikpikRate
      };
    }

    // Business rules for decision
    const savings = competitorRate - quikpikRate;
    const savingsPercent = (savings / competitorRate) * 100;

    // Use Quikpik if it's cheaper or within 5% (to account for speed advantage)
    if (savingsPercent >= -5) {
      const cheapestCompetitor = competitorRates.find(r => r.shipping_amount.amount === competitorRate);
      return {
        useQuikpik: true,
        reason: savingsPercent > 0 
          ? `Quikpik saves $${savings.toFixed(2)} (${savingsPercent.toFixed(1)}%)`
          : `Quikpik within margin ($${Math.abs(savings).toFixed(2)} more for faster delivery)`,
        quikpikRate: quikpikRate,
        competitorRate: competitorRate,
        savings: savings,
        carrierUsed: 'Quikpik'
      };
    }

    // Use competitor if significantly cheaper
    const cheapestCompetitor = competitorRates.find(r => r.shipping_amount.amount === competitorRate);
    return {
      useQuikpik: false,
      reason: `Competitor saves $${Math.abs(savings).toFixed(2)} (${Math.abs(savingsPercent).toFixed(1)}%)`,
      quikpikRate: quikpikRate,
      competitorRate: competitorRate,
      savings: savings,
      carrierUsed: cheapestCompetitor?.carrier_friendly_name || 'Competitor'
    };
  }

  /**
   * Execute Quikpik shipment
   */
  private async executeQuikpikShipment(order: any, decision: RoutingDecision): Promise<OrderProcessingResult> {
    try {
      console.log(`🚚 Creating Quikpik shipment for order ${order.orderNumber}`);

      // Convert ShipStation order to Jiayou format
      const jiayouOrder = this.convertToJiayouOrder(order);
      
      // Create shipment with Jiayou
      const shipmentResult = await this.jiayouService.createOrder(jiayouOrder);
      
      if (shipmentResult.code !== 1) {
        throw new Error(shipmentResult.message || 'Failed to create Jiayou shipment');
      }

      const trackingNumber = shipmentResult.data.trackingNo;
      console.log(`✅ Quikpik shipment created: ${trackingNumber}`);

      // Mark as shipped in ShipStation
      const marked = await this.shipStationService.markAsShipped(
        order.orderId, 
        trackingNumber || '',
        undefined, // labelUrl - will be generated later
        `https://tracking.quikpik.com/track?number=${trackingNumber}`
      );

      if (!marked) {
        console.warn('Failed to mark order as shipped in ShipStation');
      }

      return {
        success: true,
        decision: decision,
        trackingNumber: trackingNumber,
        labelUrl: shipmentResult.data.labelPath
      };

    } catch (error) {
      console.error('Error executing Quikpik shipment:', error);
      return {
        success: false,
        decision: decision,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute competitor shipment (let ShipStation handle it normally)
   */
  private async executeCompetitorShipment(order: any, decision: RoutingDecision): Promise<OrderProcessingResult> {
    console.log(`📮 Letting ShipStation handle order ${order.orderNumber} with ${decision.carrierUsed}`);
    
    // For competitor shipments, we don't create the shipment
    // We just log the decision and let ShipStation handle it normally
    return {
      success: true,
      decision: decision
    };
  }

  /**
   * Convert ShipStation order to Jiayou format
   */
  private convertToJiayouOrder(order: any): any {
    // Calculate total weight
    let totalWeight = 0;
    if (order.items && Array.isArray(order.items)) {
      totalWeight = order.items.reduce((sum: number, item: any) => {
        const itemWeight = item.weight?.value || 0;
        const quantity = item.quantity || 1;
        return sum + (itemWeight * quantity);
      }, 0);
    }

    // Convert oz to kg for Jiayou API
    const weightInKg = totalWeight > 0 ? (totalWeight * 0.0283495).toFixed(3) : "0.227";

    return {
      channel: "US001",
      reference: `QP${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
      service: "Standard",
      fromAddressId: "JFK",
      toAddress: {
        firstName: order.shipTo?.name?.split(' ')[0] || 'Customer',
        lastName: order.shipTo?.name?.split(' ').slice(1).join(' ') || '',
        company: order.shipTo?.company || '',
        addressLine1: order.shipTo?.street1 || '',
        addressLine2: order.shipTo?.street2 || '',
        city: order.shipTo?.city || '',
        stateCode: order.shipTo?.state || '',
        countryCode: order.shipTo?.country || 'US',
        postalCode: order.shipTo?.postalCode || '',
        phoneNumber: order.shipTo?.phone || '5555551234'
      },
      packages: [{
        description: order.items?.[0]?.name || "Package",
        weight: weightInKg,
        length: "15.24",
        width: "10.16", 
        height: "5.08",
        declaredValue: order.orderTotal || 10
      }]
    };
  }
}

export const middlewareEngine = new MiddlewareEngine();