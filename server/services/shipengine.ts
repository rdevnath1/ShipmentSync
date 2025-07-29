import axios from 'axios';

interface ShipEngineRateRequest {
  shipment: {
    ship_to: {
      name: string;
      address_line1: string;
      address_line2?: string;
      city_locality: string;
      state_province: string;
      postal_code: string;
      country_code: string;
      phone?: string;
    };
    ship_from: {
      name: string;
      address_line1: string;
      city_locality: string;
      state_province: string;
      postal_code: string;
      country_code: string;
    };
    packages: Array<{
      weight: {
        value: number;
        unit: 'ounce' | 'pound' | 'gram' | 'kilogram';
      };
      dimensions: {
        length: number;
        width: number;
        height: number;
        unit: 'inch' | 'centimeter';
      };
    }>;
  };
  rate_options: {
    carrier_ids?: string[];
  };
}

interface ShipEngineRate {
  rate_id: string;
  rate_type: string;
  carrier_id: string;
  carrier_nickname: string;
  carrier_friendly_name: string;
  service_type: string;
  service_code: string;
  trackable: boolean;
  carrier_delivery_days: string;
  ship_date: string;
  negotiated_rate: boolean;
  service_type_name: string;
  validation_status: string;
  warning_messages: string[];
  error_messages: string[];
  shipping_amount: {
    currency: string;
    amount: number;
  };
  insurance_amount: {
    currency: string;
    amount: number;
  };
  confirmation_amount: {
    currency: string;
    amount: number;
  };
  other_amount: {
    currency: string;
    amount: number;
  };
  zone: number;
  package_type: string;
  delivery_days: number;
  guaranteed_service: boolean;
  estimated_delivery_date: string;
  carrier_delivery_days_guaranteed: boolean;
  estimated_delivery_date_guaranteed: boolean;
}

interface ShipEngineRateResponse {
  rate_request_id: string;
  shipment_id: string;
  created_at: string;
  status: string;
  errors: any[];
  rates: ShipEngineRate[];
}

export class ShipEngineService {
  private apiKey: string;
  private baseUrl = 'https://api.shipengine.com/v1';

  constructor() {
    // ShipEngine API key - need to request from user
    this.apiKey = process.env.SHIPENGINE_API_KEY || '';
  }

  private getHeaders() {
    return {
      'API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get rates from multiple carriers (FedEx, USPS, UPS)
   */
  async getRates(rateRequest: ShipEngineRateRequest): Promise<ShipEngineRate[]> {
    try {
      if (!this.apiKey) {
        console.warn('ShipEngine API key not configured, skipping rate lookup');
        return [];
      }

      const response = await axios.post(
        `${this.baseUrl}/rates`,
        rateRequest,
        { 
          headers: this.getHeaders(),
          timeout: 30000 // 30 second timeout
        }
      );

      const rateResponse: ShipEngineRateResponse = response.data;
      
      if (rateResponse.errors && rateResponse.errors.length > 0) {
        console.error('ShipEngine rate errors:', rateResponse.errors);
      }

      // Filter out rates with errors
      const validRates = rateResponse.rates.filter(rate => 
        rate.error_messages.length === 0 && 
        rate.validation_status === 'valid'
      );

      console.log(`ShipEngine returned ${validRates.length} valid rates`);
      return validRates;

    } catch (error) {
      console.error('ShipEngine rate lookup failed:', error);
      return [];
    }
  }

  /**
   * Convert ShipStation order to ShipEngine rate request
   */
  convertShipStationOrder(order: any): ShipEngineRateRequest {
    // Default shipping origin (can be configured)
    const defaultOrigin = {
      name: "Radius Fulfillment Center",
      address_line1: "175-14 147th Ave",
      city_locality: "Queens",
      state_province: "NY",
      postal_code: "11434",
      country_code: "US"
    };

    // Calculate total weight from items
    let totalWeight = 0;
    if (order.items && Array.isArray(order.items)) {
      totalWeight = order.items.reduce((sum: number, item: any) => {
        const itemWeight = item.weight?.value || 0;
        const quantity = item.quantity || 1;
        return sum + (itemWeight * quantity);
      }, 0);
    }

    // Default to 8 oz if no weight specified
    if (totalWeight === 0) {
      totalWeight = 8; // 8 oz default
    }

    return {
      shipment: {
        ship_to: {
          name: order.shipTo?.name || 'Customer',
          address_line1: order.shipTo?.street1 || '',
          address_line2: order.shipTo?.street2 || undefined,
          city_locality: order.shipTo?.city || '',
          state_province: order.shipTo?.state || '',
          postal_code: order.shipTo?.postalCode || '',
          country_code: order.shipTo?.country || 'US',
          phone: order.shipTo?.phone || undefined,
        },
        ship_from: defaultOrigin,
        packages: [{
          weight: {
            value: totalWeight,
            unit: 'ounce'
          },
          dimensions: {
            length: 6,
            width: 4,
            height: 2,
            unit: 'inch'
          }
        }]
      },
      rate_options: {
        // Include major carriers
        carrier_ids: [] // Empty means all available carriers
      }
    };
  }

  /**
   * Get the cheapest rate from multiple carriers
   */
  getCheapestRate(rates: ShipEngineRate[]): ShipEngineRate | null {
    if (rates.length === 0) return null;

    return rates.reduce((cheapest, current) => {
      return current.shipping_amount.amount < cheapest.shipping_amount.amount 
        ? current 
        : cheapest;
    });
  }

  /**
   * Filter rates by specific carriers
   */
  getCarrierRates(rates: ShipEngineRate[], carriers: string[]): ShipEngineRate[] {
    return rates.filter(rate => 
      carriers.some(carrier => 
        rate.carrier_friendly_name.toLowerCase().includes(carrier.toLowerCase())
      )
    );
  }
}

export const shipEngineService = new ShipEngineService();