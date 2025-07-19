import { JiayouService } from './services/jiayou.js';
import { storage } from './storage.js';

const jiayouService = new JiayouService();

export async function verifyJiayouOrder(orderId: number) {
  try {
    // Get order from database
    const order = await storage.getOrder(orderId);
    if (!order) {
      return { success: false, error: 'Order not found in database' };
    }

    console.log('Verifying Jiayou order:', {
      orderId: order.id,
      jiayouOrderId: order.jiayouOrderId,
      trackingNumber: order.trackingNumber,
      status: order.status
    });

    // Check if order has Jiayou data
    if (!order.jiayouOrderId || !order.trackingNumber) {
      return { 
        success: false, 
        error: 'Order missing Jiayou data',
        orderData: order
      };
    }

    // Try to fetch tracking from Jiayou
    try {
      const trackingData = await jiayouService.getTracking(order.trackingNumber);
      
      if (trackingData.code === 1) {
        return {
          success: true,
          message: 'Order found in Jiayou system',
          trackingData,
          orderData: order
        };
      } else {
        return {
          success: false,
          error: `Jiayou tracking unavailable: ${trackingData.message}`,
          trackingData,
          orderData: order,
          note: 'This is a known issue with Jiayou tracking endpoints returning 404. The tracking number exists but cannot be queried.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Jiayou API error: ${error.message}`,
        orderData: order,
        note: 'Tracking endpoints appear to be deprecated or moved.'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${error.message}`
    };
  }
}

export async function debugAllOrders() {
  try {
    const orders = await storage.getAllOrders();
    const results = [];

    for (const order of orders) {
      const verification = await verifyJiayouOrder(order.id);
      results.push({
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          referenceNumber: order.referenceNumber,
          status: order.status,
          jiayouOrderId: order.jiayouOrderId,
          trackingNumber: order.trackingNumber
        },
        verification
      });
    }

    return results;
  } catch (error) {
    return { error: error.message };
  }
}