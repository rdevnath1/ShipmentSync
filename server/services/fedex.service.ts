import axios from 'axios';

export interface FedExRateRequest {
  fromZip: string;
  toZip: string;
  weight: number; // in pounds
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

export interface FedExRate {
  service: string;
  rate: number;
  deliveryDays: string;
}

export interface FedExCredentials {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  accountNumber: string;
}

export interface FedExAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface FedExShipmentRequest {
  fromAddress: FedExAddress;
  toAddress: FedExAddress;
  weight: number; // in pounds
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  serviceType?: string; // e.g., 'FEDEX_GROUND', 'STANDARD_OVERNIGHT'
  packagingType?: string; // e.g., 'YOUR_PACKAGING'
  labelFormat?: string; // e.g., 'COMMON2D', 'PDF'
  labelSize?: string; // e.g., 'PAPER_4X6'
}

export interface FedExShipmentResponse {
  trackingNumber: string;
  labelUrl: string;
  labelFormat: string;
  totalCost: number;
  estimatedDeliveryDate?: string;
}

class FedExService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accountNumber: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(credentials?: FedExCredentials) {
    if (credentials) {
      this.baseUrl = credentials.apiUrl;
      this.clientId = credentials.clientId;
      this.clientSecret = credentials.clientSecret;
      this.accountNumber = credentials.accountNumber;
    } else {
      // Fallback to environment variables for backward compatibility
      this.baseUrl = process.env.FEDEX_API_URL || 'https://apis.fedex.com';
      this.clientId = process.env.FEDEX_CLIENT_ID || '';
      this.clientSecret = process.env.FEDEX_CLIENT_SECRET || '';
      this.accountNumber = process.env.FEDEX_ACCOUNT_NUMBER || '';
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('FedEx API credentials not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 55 minutes from now (token is valid for 1 hour)
      this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
      
      return this.accessToken;
    } catch (error: any) {
      console.error('FedEx OAuth error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with FedEx');
    }
  }

  async getRates(request: FedExRateRequest): Promise<FedExRate[]> {
    const token = await this.getAccessToken();

    const rateRequest = {
      accountNumber: {
        value: this.accountNumber
      },
      requestedShipment: {
        shipper: {
          address: {
            postalCode: request.fromZip,
            countryCode: 'US'
          }
        },
        recipient: {
          address: {
            postalCode: request.toZip,
            countryCode: 'US'
          }
        },
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        rateRequestType: ['ACCOUNT'],
        requestedPackageLineItems: [{
          weight: {
            units: 'LB',
            value: request.weight
          },
          dimensions: {
            length: Math.round(request.dimensions.length),
            width: Math.round(request.dimensions.width),
            height: Math.round(request.dimensions.height),
            units: 'IN'
          }
        }]
      }
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/rate/v1/rates/quotes`,
        rateRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-locale': 'en_US',
            'Content-Type': 'application/json'
          }
        }
      );

      return this.parseRateResponse(response.data);
    } catch (error: any) {
      console.error('FedEx API error:', error.response?.data || error.message);
      throw new Error('Failed to get FedEx rates');
    }
  }

  private parseRateResponse(data: any): FedExRate[] {
    const rates: FedExRate[] = [];

    if (data.output?.rateReplyDetails) {
      for (const rateDetail of data.output.rateReplyDetails) {
        const serviceName = rateDetail.serviceType;
        const transitTime = rateDetail.commit?.dateDetail?.dayFormat || 'N/A';
        
        // Get the discounted rate if available, otherwise use the base rate
        const ratedShipmentDetail = rateDetail.ratedShipmentDetails?.[0];
        const totalNetCharge = ratedShipmentDetail?.totalNetCharge || 
                              ratedShipmentDetail?.totalBaseCharge;

        if (totalNetCharge) {
          rates.push({
            service: this.formatServiceName(serviceName),
            rate: parseFloat(totalNetCharge),
            deliveryDays: this.formatDeliveryDays(transitTime)
          });
        }
      }
    }

    return rates;
  }

  private formatServiceName(serviceType: string): string {
    const serviceMap: { [key: string]: string } = {
      'FEDEX_GROUND': 'FedEx Ground',
      'FEDEX_EXPRESS_SAVER': 'FedEx Express Saver',
      'FEDEX_2_DAY': 'FedEx 2Day',
      'FEDEX_2_DAY_AM': 'FedEx 2Day A.M.',
      'STANDARD_OVERNIGHT': 'FedEx Standard Overnight',
      'PRIORITY_OVERNIGHT': 'FedEx Priority Overnight',
      'FIRST_OVERNIGHT': 'FedEx First Overnight'
    };

    return serviceMap[serviceType] || serviceType;
  }

  private formatDeliveryDays(transitTime: string): string {
    // Convert FedEx transit time format to simple days format
    if (transitTime === 'N/A') return '3-5';
    
    const match = transitTime.match(/(\d+)/);
    if (match) {
      const days = parseInt(match[1]);
      if (days === 1) return '1';
      if (days === 2) return '2';
      if (days === 3) return '3';
      return `${days}`;
    }
    
    return '3-5';
  }

  /**
   * Create a FedEx shipment and generate shipping label
   */
  async createShipment(request: FedExShipmentRequest): Promise<FedExShipmentResponse> {
    const token = await this.getAccessToken();

    if (!this.accountNumber) {
      throw new Error('FedEx account number not configured');
    }

    const shipmentRequest = {
      labelResponseOptions: request.labelFormat || 'URL_ONLY',
      requestedShipment: {
        shipper: {
          contact: {
            personName: request.fromAddress.name,
            phoneNumber: request.fromAddress.phone || '1234567890',
            emailAddress: request.fromAddress.email || 'noreply@quikpik.io'
          },
          address: {
            streetLines: [request.fromAddress.street1, request.fromAddress.street2].filter(Boolean),
            city: request.fromAddress.city,
            stateOrProvinceCode: request.fromAddress.state,
            postalCode: request.fromAddress.postalCode,
            countryCode: request.fromAddress.country
          }
        },
        recipients: [{
          contact: {
            personName: request.toAddress.name,
            phoneNumber: request.toAddress.phone || '1234567890',
            emailAddress: request.toAddress.email || 'customer@example.com'
          },
          address: {
            streetLines: [request.toAddress.street1, request.toAddress.street2].filter(Boolean),
            city: request.toAddress.city,
            stateOrProvinceCode: request.toAddress.state,
            postalCode: request.toAddress.postalCode,
            countryCode: request.toAddress.country,
            residential: true
          }
        }],
        shippingChargesPayment: {
          paymentType: 'SENDER',
          payor: {
            responsibleParty: {
              accountNumber: {
                value: this.accountNumber
              }
            }
          }
        },
        labelSpecification: {
          imageType: request.labelFormat || 'PDF',
          labelStockType: request.labelSize || 'PAPER_4X6'
        },
        rateRequestType: ['ACCOUNT'],
        serviceType: request.serviceType || 'FEDEX_GROUND',
        packagingType: request.packagingType || 'YOUR_PACKAGING',
        requestedPackageLineItems: [{
          weight: {
            units: 'LB',
            value: request.weight
          },
          dimensions: {
            length: Math.round(request.dimensions.length),
            width: Math.round(request.dimensions.width),
            height: Math.round(request.dimensions.height),
            units: 'IN'
          }
        }]
      },
      accountNumber: {
        value: this.accountNumber
      }
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/ship/v1/shipments`,
        shipmentRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-locale': 'en_US',
            'Content-Type': 'application/json'
          }
        }
      );

      return this.parseShipmentResponse(response.data);
    } catch (error: any) {
      console.error('FedEx shipment creation error:', error.response?.data || error.message);
      if (error.response?.data?.errors) {
        console.error('FedEx API errors:', JSON.stringify(error.response.data.errors, null, 2));
      }
      throw new Error(`Failed to create FedEx shipment: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  private parseShipmentResponse(data: any): FedExShipmentResponse {
    try {
      const output = data.output;
      const transactionShipments = output.transactionShipments?.[0];
      const completedShipmentDetail = transactionShipments?.completedShipmentDetail;
      const completedPackageDetails = completedShipmentDetail?.completedPackageDetails?.[0];
      
      if (!completedPackageDetails?.trackingIds?.[0]?.trackingNumber) {
        throw new Error('No tracking number found in FedEx response');
      }

      const trackingNumber = completedPackageDetails.trackingIds[0].trackingNumber;
      const label = completedPackageDetails.label;
      const shipmentRating = completedShipmentDetail?.shipmentRating;
      
      let labelUrl = '';
      if (label?.parts?.[0]?.image) {
        // If we get base64 image data, we'd need to save it and provide a URL
        // For now, assume URL_ONLY response
        labelUrl = label.parts[0].image;
      }

      const totalCost = shipmentRating?.actualRateType === 'PAYOR_ACCOUNT_SHIPMENT' 
        ? parseFloat(shipmentRating.shipmentRateDetails?.[0]?.totalNetCharge || '0')
        : parseFloat(shipmentRating?.shipmentRateDetails?.[0]?.totalBaseCharge || '0');

      return {
        trackingNumber,
        labelUrl,
        labelFormat: label?.imageType || 'PDF',
        totalCost,
        estimatedDeliveryDate: completedShipmentDetail?.operationalDetail?.deliveryDay
      };
    } catch (error) {
      console.error('Error parsing FedEx shipment response:', error);
      console.error('Raw response:', JSON.stringify(data, null, 2));
      throw new Error('Failed to parse FedEx shipment response');
    }
  }

  /**
   * Track a FedEx shipment
   */
  async trackShipment(trackingNumber: string): Promise<any> {
    const token = await this.getAccessToken();

    const trackRequest = {
      includeDetailedScans: true,
      trackingInfo: [{
        trackingNumberInfo: {
          trackingNumber
        }
      }]
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/track/v1/trackingnumbers`,
        trackRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-locale': 'en_US',
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('FedEx tracking error:', error.response?.data || error.message);
      throw new Error('Failed to track FedEx shipment');
    }
  }
}

export const fedexService = new FedExService();