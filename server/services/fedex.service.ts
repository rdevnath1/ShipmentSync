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

class FedExService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accountNumber: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.baseUrl = process.env.FEDEX_API_URL || 'https://apis.fedex.com';
    this.clientId = process.env.FEDEX_CLIENT_ID || '';
    this.clientSecret = process.env.FEDEX_CLIENT_SECRET || '';
    this.accountNumber = process.env.FEDEX_ACCOUNT_NUMBER || '';
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
}

export const fedexService = new FedExService();