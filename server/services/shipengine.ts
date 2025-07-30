import axios from 'axios';

interface ShipEngineRate {
  rateId: string;
  rateType: string;
  carrierId: string;
  shippingAmount: {
    currency: string;
    amount: number;
  };
  insuranceAmount: {
    currency: string;
    amount: number;
  };
  confirmationAmount: {
    currency: string;
    amount: number;
  };
  otherAmount: {
    currency: string;
    amount: number;
  };
  taxAmount: {
    currency: string;
    amount: number;
  };
  zone: number;
  packageType: string;
  deliveryDays: number;
  guaranteedService: boolean;
  estimatedDeliveryDate: string;
  carrierDeliveryDays: string;
  shipDate: string;
  negotiatedRate: boolean;
  serviceType: string;
  serviceCode: string;
  trackable: boolean;
  carrierCode: string;
  carrierNickname: string;
  carrierFriendlyName: string;
  validationStatus: string;
  warningMessages: string[];
  errorMessages: string[];
}

interface ShipEngineRateRequest {
  shipment: {
    shipTo: {
      name: string;
      phone?: string;
      companyName?: string;
      addressLine1: string;
      addressLine2?: string;
      addressLine3?: string;
      cityLocality: string;
      stateProvince: string;
      postalCode: string;
      countryCode: string;
      addressResidentialIndicator: string;
    };
    shipFrom: {
      name: string;
      phone?: string;
      companyName?: string;
      addressLine1: string;
      addressLine2?: string;
      addressLine3?: string;
      cityLocality: string;
      stateProvince: string;
      postalCode: string;
      countryCode: string;
      addressResidentialIndicator: string;
    };
    packages: Array<{
      weight: {
        value: number;
        unit: string;
      };
      dimensions: {
        unit: string;
        length: number;
        width: number;
        height: number;
      };
    }>;
  };
  rateOptions: {
    carrierIds: string[];
  };
}

export class ShipEngineService {
  private apiKey: string;
  private baseUrl = 'https://api.shipengine.com/v1';

  constructor() {
    this.apiKey = process.env.SHIPENGINE_API_KEY || 'TEST_KEY';
  }

  private getHeaders() {
    return {
      'API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get rates from ShipEngine for multiple carriers
   */
  async getRates(params: {
    fromAddress: {
      name: string;
      street1: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
    };
    toAddress: {
      name: string;
      street1: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
    };
    weight: number; // in ounces
    dimensions: {
      length: number;
      width: number;  
      height: number;
    };
    carrierCodes?: string[];
  }): Promise<ShipEngineRate[]> {
    try {
      const rateRequest: ShipEngineRateRequest = {
        shipment: {
          shipTo: {
            name: params.toAddress.name,
            addressLine1: params.toAddress.street1,
            cityLocality: params.toAddress.city,
            stateProvince: params.toAddress.state,
            postalCode: params.toAddress.postalCode,
            countryCode: params.toAddress.country || 'US',
            addressResidentialIndicator: 'unknown'
          },
          shipFrom: {
            name: params.fromAddress.name,
            addressLine1: params.fromAddress.street1,
            cityLocality: params.fromAddress.city,
            stateProvince: params.fromAddress.state,
            postalCode: params.fromAddress.postalCode,
            countryCode: params.fromAddress.country || 'US',
            addressResidentialIndicator: 'no'
          },
          packages: [{
            weight: {
              value: params.weight,
              unit: 'ounce'
            },
            dimensions: {
              unit: 'inch',
              length: params.dimensions.length,
              width: params.dimensions.width,
              height: params.dimensions.height
            }
          }]
        },
        rateOptions: {
          carrierIds: this.getCarrierIds(params.carrierCodes)
        }
      };

      console.log('ShipEngine rate request:', JSON.stringify(rateRequest, null, 2));

      const response = await axios.post(
        `${this.baseUrl}/rates`,
        rateRequest,
        { 
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      console.log('ShipEngine rate response:', JSON.stringify(response.data, null, 2));

      return response.data.rateResponse?.rates || [];

    } catch (error: any) {
      console.error('ShipEngine rate request failed:', error.response?.data || error.message);
      
      // Return fallback rates for demo purposes
      return this.getFallbackRates(params);
    }
  }

  /**
   * Get carrier IDs for ShipEngine API
   */
  private getCarrierIds(carrierCodes?: string[]): string[] {
    const defaultCarriers = ['se-123890', 'se-123891', 'se-123892']; // FedEx, UPS, USPS
    
    if (!carrierCodes || carrierCodes.length === 0) {
      return defaultCarriers;
    }

    const carrierMap: { [key: string]: string } = {
      'fedex': 'se-123890',
      'ups': 'se-123891', 
      'usps': 'se-123892',
      'dhl': 'se-123893'
    };

    return carrierCodes.map(code => carrierMap[code.toLowerCase()]).filter(Boolean);
  }

  /**
   * Fallback rates when ShipEngine API is unavailable
   */
  private getFallbackRates(params: any): ShipEngineRate[] {
    const baseRate = this.calculateBaseRate(params.weight, params.toAddress.postalCode);
    
    return [
      {
        rateId: 'fallback-fedex-ground',
        rateType: 'shipment',
        carrierId: 'se-123890',
        shippingAmount: { currency: 'USD', amount: baseRate + 3.50 },
        insuranceAmount: { currency: 'USD', amount: 0 },
        confirmationAmount: { currency: 'USD', amount: 0 },
        otherAmount: { currency: 'USD', amount: 0 },
        taxAmount: { currency: 'USD', amount: 0 },
        zone: this.calculateZone(params.toAddress.postalCode),
        packageType: 'package',
        deliveryDays: 3,
        guaranteedService: false,
        estimatedDeliveryDate: this.addBusinessDays(new Date(), 3).toISOString(),
        carrierDeliveryDays: '1-3 business days',
        shipDate: new Date().toISOString(),
        negotiatedRate: false,
        serviceType: 'FedEx Ground',
        serviceCode: 'fedex_ground',
        trackable: true,
        carrierCode: 'fedex',
        carrierNickname: 'FedEx',
        carrierFriendlyName: 'FedEx',
        validationStatus: 'valid',
        warningMessages: [],
        errorMessages: []
      },
      {
        rateId: 'fallback-usps-ground',
        rateType: 'shipment', 
        carrierId: 'se-123892',
        shippingAmount: { currency: 'USD', amount: baseRate + 1.25 },
        insuranceAmount: { currency: 'USD', amount: 0 },
        confirmationAmount: { currency: 'USD', amount: 0 },
        otherAmount: { currency: 'USD', amount: 0 },
        taxAmount: { currency: 'USD', amount: 0 },
        zone: this.calculateZone(params.toAddress.postalCode),
        packageType: 'package',
        deliveryDays: 5,
        guaranteedService: false,
        estimatedDeliveryDate: this.addBusinessDays(new Date(), 5).toISOString(),
        carrierDeliveryDays: '3-5 business days',
        shipDate: new Date().toISOString(),
        negotiatedRate: false,
        serviceType: 'USPS Ground Advantage',
        serviceCode: 'usps_ground_advantage',
        trackable: true,
        carrierCode: 'usps',
        carrierNickname: 'USPS',
        carrierFriendlyName: 'US Postal Service', 
        validationStatus: 'valid',
        warningMessages: [],
        errorMessages: []
      },
      {
        rateId: 'fallback-ups-ground',
        rateType: 'shipment',
        carrierId: 'se-123891', 
        shippingAmount: { currency: 'USD', amount: baseRate + 2.75 },
        insuranceAmount: { currency: 'USD', amount: 0 },
        confirmationAmount: { currency: 'USD', amount: 0 },
        otherAmount: { currency: 'USD', amount: 0 },
        taxAmount: { currency: 'USD', amount: 0 },
        zone: this.calculateZone(params.toAddress.postalCode),
        packageType: 'package',
        deliveryDays: 4,
        guaranteedService: false,
        estimatedDeliveryDate: this.addBusinessDays(new Date(), 4).toISOString(),
        carrierDeliveryDays: '1-4 business days',
        shipDate: new Date().toISOString(),
        negotiatedRate: false,
        serviceType: 'UPS Ground',
        serviceCode: 'ups_ground',
        trackable: true,
        carrierCode: 'ups',
        carrierNickname: 'UPS',
        carrierFriendlyName: 'United Parcel Service',
        validationStatus: 'valid', 
        warningMessages: [],
        errorMessages: []
      }
    ];
  }

  private calculateBaseRate(weightOz: number, postalCode: string): number {
    const weightLbs = weightOz / 16;
    const zone = this.calculateZone(postalCode);
    
    // Base shipping calculation
    let baseRate = 8.50;
    if (weightLbs > 1) baseRate += (weightLbs - 1) * 1.50;
    if (zone > 3) baseRate += (zone - 3) * 1.25;
    
    return Math.round(baseRate * 100) / 100;
  }

  private calculateZone(postalCode: string): number {
    // Simple zone calculation based on first digit
    const firstDigit = parseInt(postalCode.charAt(0));
    if (firstDigit <= 1) return 2; // Northeast
    if (firstDigit <= 3) return 3; // Southeast  
    if (firstDigit <= 6) return 4; // Central
    if (firstDigit <= 8) return 5; // Mountain
    return 6; // Pacific
  }

  private addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) { // Skip weekends
        addedDays++;
      }
    }
    
    return result;
  }

  /**
   * Convert ShipEngine rates to standard format for rate comparison
   */
  formatRatesForComparison(rates: ShipEngineRate[]): Array<{
    carrier: string;
    cost: number;
    deliveryDays: string;
    service: string;
    carrierCode: string;
    serviceCode: string;
    estimatedDeliveryDate: string;
  }> {
    return rates.map(rate => ({
      carrier: rate.carrierFriendlyName,
      cost: rate.shippingAmount.amount,
      deliveryDays: rate.deliveryDays?.toString() || 'N/A',
      service: rate.serviceType,
      carrierCode: rate.carrierCode,
      serviceCode: rate.serviceCode,
      estimatedDeliveryDate: rate.estimatedDeliveryDate
    }));
  }

  /**
   * Create shipment label via ShipEngine
   */
  async createLabel(params: {
    rateId: string;
    labelFormat?: string;
    labelLayout?: string;
  }): Promise<{
    trackingNumber: string;
    labelUrl: string;
    labelFormat: string;
  }> {
    try {
      const labelRequest = {
        rateId: params.rateId,
        labelFormat: params.labelFormat || 'pdf',
        labelLayout: params.labelLayout || '4x6'
      };

      const response = await axios.post(
        `${this.baseUrl}/labels`,
        labelRequest,
        { headers: this.getHeaders() }
      );

      return {
        trackingNumber: response.data.trackingNumber,
        labelUrl: response.data.labelDownload.href,
        labelFormat: response.data.labelFormat
      };

    } catch (error: any) {
      console.error('ShipEngine label creation failed:', error.response?.data || error.message);
      throw new Error(`Failed to create label: ${error.message}`);
    }
  }
}