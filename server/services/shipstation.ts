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

  async markAsShipped(orderId: number, trackingNumber: string, labelUrl?: string): Promise<boolean> {
    try {
      console.log(`Marking ShipStation order ${orderId} as shipped with tracking ${trackingNumber}`);
      
      const shipmentData = {
        orderId,
        carrierCode: 'jiayou',
        trackingNumber,
        shipDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        notifyCustomer: true,
        notifySalesChannel: true,
        ...(labelUrl && { labelUrl }) // Only include labelUrl if provided
      };

      const response = await axios.post(
        `${this.baseUrl}/orders/markasshipped`,
        shipmentData,
        { headers: this.getAuthHeaders() }
      );

      console.log('ShipStation mark as shipped response:', response.data);
      return true;
    } catch (error) {
      console.error('Error marking order as shipped in ShipStation:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      return false;
    }
  }

  // Keep the old method for backward compatibility but use the new one
  async updateOrderWithTracking(orderId: number, trackingNumber: string, labelUrl?: string): Promise<boolean> {
    return this.markAsShipped(orderId, trackingNumber, labelUrl);
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
