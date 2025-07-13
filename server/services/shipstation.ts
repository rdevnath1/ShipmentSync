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

  async updateOrderWithTracking(orderId: number, trackingNumber: string, carrierCode: string = 'other'): Promise<boolean> {
    try {
      const orderData = {
        orderId,
        trackingNumber,
        carrierCode,
        orderStatus: 'shipped',
      };

      await axios.post(
        `${this.baseUrl}/orders/createorder`,
        orderData,
        { headers: this.getAuthHeaders() }
      );

      return true;
    } catch (error) {
      console.error('Error updating order in ShipStation:', error);
      return false;
    }
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
