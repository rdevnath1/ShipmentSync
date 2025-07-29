import axios from 'axios';

interface ShipStationOrder {
  orderId: number;
  orderNumber: string;
  orderKey: string;
  customerUsername: string;
  customerEmail: string;
  shipTo: {
    name: string;
    company: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  billTo: {
    name: string;
    company: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  items: Array<{
    orderItemId: number;
    lineItemKey: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    weight: {
      value: number;
      units: string;
    };
  }>;
  orderTotal: number;
  amountPaid: number;
  orderStatus: string;
  orderDate: string;
  shipDate: string;
  carrierCode: string;
  serviceCode: string;
  packageCode: string;
  confirmation: string;
  shipmentId: number;
  trackingNumber: string;
}

export class ShipStationService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://ssapi.shipstation.com';

  constructor() {
    this.apiKey = process.env.SHIPSTATION_API_KEY || '58422b16196741d7bb3c32d7e6e43827';
    this.apiSecret = process.env.SHIPSTATION_API_SECRET || '4cd58d5f1e90467aa87268abbb5eeb3b';
  }

  private getAuthHeaders() {
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  async getOrders(storeId?: number, orderStatus?: string): Promise<ShipStationOrder[]> {
    try {
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId.toString());
      if (orderStatus) params.append('orderStatus', orderStatus);
      
      const response = await axios.get(
        `${this.baseUrl}/orders?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      
      return response.data.orders || [];
    } catch (error) {
      console.error('Error fetching orders from ShipStation:', error);
      throw new Error('Failed to fetch orders from ShipStation');
    }
  }

  async getOrder(orderId: number): Promise<ShipStationOrder | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}`,
        { headers: this.getAuthHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching order from ShipStation:', error);
      return null;
    }
  }

  async markAsShipped(orderId: number, trackingNumber: string, labelUrl?: string, trackingUrl?: string): Promise<boolean> {
    try {
      console.log(`Creating ShipStation shipment for order ${orderId} with tracking ${trackingNumber}`);
      
      // First, get the order details to create proper shipment
      const order = await this.getOrder(orderId);
      if (!order) {
        console.error('Could not fetch order details from ShipStation');
        return false;
      }

      // Create shipment with label data if available
      const shipmentData = {
        orderId,
        carrierCode: 'other', // Use 'other' since ShipStation doesn't recognize jiayou
        serviceCode: 'other',
        packageCode: 'package',
        confirmation: 'none',
        shipDate: new Date().toISOString(),
        trackingNumber,
        notifyCustomer: true,
        notifySalesChannel: true,
        shipTo: order.shipTo,
        weight: {
          value: 1,
          units: 'pounds'
        },
        dimensions: {
          units: 'inches',
          length: 10,
          width: 10,
          height: 4
        },
        ...(trackingUrl && { 
          internalNotes: `🚚 Quikpik Tracking: ${trackingUrl}`,
          customerNotes: `📦 Track your package: ${trackingUrl}`
        }),
        ...(labelUrl && {
          labelData: await this.getLabelDataFromUrl(labelUrl)
        })
      };

      console.log('Creating shipment with data:', { ...shipmentData, labelData: labelUrl ? '[PDF_DATA]' : undefined });

      const response = await axios.post(
        `${this.baseUrl}/orders/createlabelfororder`,
        shipmentData,
        { headers: this.getAuthHeaders() }
      );

      console.log('ShipStation create shipment response:', response.data);
      return true;
    } catch (error) {
      console.error('Error creating shipment in ShipStation:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response data:', axiosError.response?.data);
        console.error('Response status:', axiosError.response?.status);
      }
      
      // Fallback to mark as shipped if shipment creation fails
      try {
        console.log('Falling back to mark as shipped...');
        const fallbackData = {
          orderId,
          carrierCode: 'other', // Use 'other' since jiayou isn't recognized
          trackingNumber,
          shipDate: new Date().toISOString().split('T')[0],
          notifyCustomer: true,
          notifySalesChannel: true,
          ...(trackingUrl && { 
            internalNotes: `🚚 Quikpik Tracking: ${trackingUrl}`,
            customerNotes: `📦 Track your package: ${trackingUrl}`
          }),
        };

        const fallbackResponse = await axios.post(
          `${this.baseUrl}/orders/markasshipped`,
          fallbackData,
          { headers: this.getAuthHeaders() }
        );

        console.log('Fallback mark as shipped successful:', fallbackResponse.data);
        return true;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return false;
      }
    }
  }

  private async getLabelDataFromUrl(labelUrl: string): Promise<string | null> {
    try {
      const response = await axios.get(labelUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      const base64Data = Buffer.from(response.data).toString('base64');
      console.log(`Downloaded label data: ${base64Data.length} characters`);
      return base64Data;
    } catch (error) {
      console.error('Error downloading label data:', error);
      return null;
    }
  }

  async getRates(fromZip: string, toZip: string, weight: number, dimensions: { length: number; width: number; height: number }): Promise<any[]> {
    const carriers = ['fedex', 'usps', 'ups']; // Common carriers
    const allRates: any[] = [];

    for (const carrierCode of carriers) {
      try {
        const rateRequest = {
          carrierCode: carrierCode,
          fromPostalCode: fromZip,
          toState: null,
          toCountry: 'US',
          toPostalCode: toZip,
          toCity: null,
          weight: {
            value: weight,
            units: 'pounds'
          },
          dimensions: {
            units: 'inches',
            length: dimensions.length,
            width: dimensions.width,
            height: dimensions.height
          },
          confirmation: 'none',
          residential: false
        };

        console.log(`ShipStation ${carrierCode} rate request:`, JSON.stringify(rateRequest, null, 2));

        const response = await axios.post(
          `${this.baseUrl}/shipments/getrates`,
          rateRequest,
          { headers: this.getAuthHeaders() }
        );

        console.log(`ShipStation ${carrierCode} rate response:`, JSON.stringify(response.data, null, 2));
        
        // Add carrier code to each rate for identification
        if (response.data && Array.isArray(response.data)) {
          const ratesWithCarrier = response.data.map((rate: any) => ({
            ...rate,
            carrierCode: carrierCode
          }));
          allRates.push(...ratesWithCarrier);
        }
      } catch (error: any) {
        console.error(`Error getting ${carrierCode} rates from ShipStation:`, error.response?.data || error.message);
        // Continue with other carriers even if one fails
      }
    }

    return allRates;
  }

  // Keep the old method for backward compatibility but use the new one
  async updateOrderWithTracking(orderId: number, trackingNumber: string, labelUrl?: string, trackingUrl?: string): Promise<boolean> {
    return this.markAsShipped(orderId, trackingNumber, labelUrl, trackingUrl);
  }

  async createShipment(orderId: number, trackingNumber: string): Promise<boolean> {
    try {
      const shipmentData = {
        orderId,
        trackingNumber,
        carrierCode: 'other',
        serviceCode: null,
        packageCode: 'package',
        confirmation: 'none',
        shipDate: new Date().toISOString(),
        weight: {
          value: 1,
          units: 'pounds'
        },
        dimensions: {
          units: 'inches',
          length: 10,
          width: 10,
          height: 10
        }
      };

      await axios.post(
        `${this.baseUrl}/shipments/createlabel`,
        shipmentData,
        { headers: this.getAuthHeaders() }
      );

      return true;
    } catch (error) {
      console.error('Error creating shipment in ShipStation:', error);
      return false;
    }
  }
}
