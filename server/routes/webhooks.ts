import express from "express";
import crypto from "crypto";
import { storage } from "../storage";
import { RateShopperService } from "../services/rate-shopper";
import { ShipStationService } from "../services/shipstation";

const router = express.Router();

// Jiayou webhook endpoint for tracking updates
router.post("/jiayou/tracking", async (req, res) => {
  try {
    const signature = req.headers['x-jiayou-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature (if Jiayou provides one)
    if (signature && !verifyJiayouSignature(payload, signature)) {
      console.warn("Invalid Jiayou webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { trackingNumber, status, pathCode, pathInfo, pathAddr, pathTime } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({ error: "trackingNumber is required" });
    }

    console.log(`Webhook received for tracking: ${trackingNumber}, status: ${status}`);

    // Find order by tracking number first
    const orders = await storage.getOrdersWithStats();
    const order = orders.orders.find(o => o.trackingNumber === trackingNumber);
    
    if (order) {
      // Create tracking event
      await storage.createTrackingEvent({
        orderId: order.id,
        event: status || pathCode || 'status_update',
        description: pathInfo || `Status update: ${status}`,
        location: pathAddr || '',
        timestamp: pathTime ? new Date(pathTime) : new Date()
      });
    }

    console.log(`Webhook processed successfully for tracking: ${trackingNumber}`);

    // Update order status if tracking indicates delivery
    if (status === 'delivered' || pathInfo?.toLowerCase().includes('delivered')) {
      await updateOrderStatusForDelivery(trackingNumber);
    }

    res.json({
      success: true,
      message: "Webhook processed successfully",
      trackingNumber,
      processedStatus: status || pathCode
    });

  } catch (error) {
    console.error("Jiayou webhook error:", error);
    
    console.error("Webhook processing failed:", error instanceof Error ? error.message : 'Unknown error');

    res.status(500).json({ error: "Failed to process webhook" });
  }
});

// ShipStation webhook endpoint for order updates with rate shopping
router.post("/shipstation/orders", async (req, res) => {
  try {
    const { resource_url, resource_type } = req.body;

    if (resource_type !== 'ORDER_NOTIFY') {
      return res.json({ message: "Webhook type not handled" });
    }

    console.log(`ShipStation webhook: ${resource_type} - ${resource_url}`);

    // Acknowledge webhook immediately to prevent timeouts
    res.json({ success: true, message: "ShipStation webhook received and processing" });

    // Process order asynchronously
    processShipStationOrder(resource_url).catch(error => {
      console.error("Async order processing failed:", error);
    });

  } catch (error) {
    console.error("ShipStation webhook error:", error);
    res.status(500).json({ error: "Failed to process ShipStation webhook" });
  }
});

// Generic carrier webhook endpoint
router.post("/carrier/:carrierName", async (req, res) => {
  try {
    const { carrierName } = req.params;
    const webhookData = req.body;

    console.log(`Generic webhook from ${carrierName}:`, webhookData);

    // Store raw webhook data for processing (simplified)
    console.log(`Generic webhook from ${carrierName} processed successfully`);

    res.json({ 
      success: true, 
      message: `Webhook from ${carrierName} received and logged`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`${req.params.carrierName} webhook error:`, error);
    res.status(500).json({ error: "Failed to process carrier webhook" });
  }
});

// Webhook health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Quikpik Webhook Handler",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/webhooks/jiayou/tracking",
      "/webhooks/shipstation/orders",
      "/webhooks/carrier/:carrierName"
    ]
  });
});

// List recent webhook activity (authenticated)
router.get("/activity", async (req, res) => {
  try {
    // Placeholder for webhook activity tracking
    // In a real implementation, this would query webhook logs from database
    res.json({
      activity: [],
      total: 0,
      period: "Recent webhook activity",
      message: "Webhook activity tracking not fully implemented yet"
    });

  } catch (error) {
    console.error("Webhook activity error:", error);
    res.status(500).json({ error: "Failed to fetch webhook activity" });
  }
});

// Helper functions
function verifyJiayouSignature(payload: string, signature: string): boolean {
  // Implement Jiayou signature verification if they provide it
  // For now, return true (webhook verification disabled)
  const expectedSignature = crypto
    .createHmac('sha256', process.env.JIAYOU_WEBHOOK_SECRET || 'default-secret')
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}

async function updateOrderStatusForDelivery(trackingNumber: string): Promise<void> {
  try {
    // Find order by tracking number and update status
    const orders = await storage.getOrdersWithStats();
    const order = orders.orders.find(o => o.trackingNumber === trackingNumber);
    
    if (order && order.status !== 'delivered') {
      await storage.updateOrder(order.id, { 
        status: 'delivered',
        deliveredAt: new Date()
      });
      
      console.log(`Order ${order.id} marked as delivered via webhook`);
    }
  } catch (error) {
    console.error("Error updating order status for delivery:", error);
  }
}

// Process ShipStation order with rate shopping
async function processShipStationOrder(resourceUrl: string): Promise<void> {
  const rateShopperService = new RateShopperService();
  const shipStationService = new ShipStationService();

  try {
    console.log(`Processing ShipStation order from: ${resourceUrl}`);
    
    // Fetch order details from ShipStation
    const orderData = await shipStationService.getOrderFromResource(resourceUrl);
    
    if (!orderData) {
      console.error("Failed to fetch order data from ShipStation");
      return;
    }

    // Skip if order is already shipped
    if (orderData.orderStatus === 'shipped' || orderData.trackingNumber) {
      console.log(`Order ${orderData.orderNumber} already shipped, skipping`);
      return;
    }

    console.log(`Rate shopping for order ${orderData.orderNumber}`);
    
    // Compare rates between Quikpik and ShipStation carriers
    const rateComparison = await rateShopperService.compareRates(orderData);
    
    console.log(`Rate comparison complete. Winner: ${rateComparison.winner.carrier} at $${rateComparison.winner.cost}`);
    
    // Create shipment with winning carrier
    const shipmentResult = await rateShopperService.createShipment(orderData, rateComparison);
    
    if (shipmentResult.success) {
      // Mark order as shipped in ShipStation
      await shipStationService.markOrderAsShipped({
        orderId: orderData.orderId,
        carrierCode: shipmentResult.carrier === 'quikpik' ? 'quikpik' : rateComparison.competitorRates.find(r => r.carrier === shipmentResult.carrier)?.carrierCode || 'other',
        trackingNumber: shipmentResult.trackingNumber!,
        shipDate: new Date().toISOString().split('T')[0],
        notifyCustomer: true,
        notifyThirdParty: false
      });

      console.log(`Order ${orderData.orderNumber} shipped successfully via ${shipmentResult.carrier} - Tracking: ${shipmentResult.trackingNumber}`);
      
      // Store in local database for tracking
      await storage.createOrder({
        orderNumber: orderData.orderNumber,
        customerName: orderData.shipTo.name,
        customerEmail: orderData.customerEmail,
        shipToAddress: `${orderData.shipTo.street1}, ${orderData.shipTo.city}, ${orderData.shipTo.state} ${orderData.shipTo.postalCode}`,
        items: JSON.stringify(orderData.items),
        totalWeight: calculateOrderWeight(orderData.items),
        carrier: shipmentResult.carrier,
        service: rateComparison.winner.carrier === 'quikpik' ? rateComparison.quikpikRate.service : 
                rateComparison.competitorRates.find(r => r.carrier === shipmentResult.carrier)?.service || 'Standard',
        cost: shipmentResult.cost,
        trackingNumber: shipmentResult.trackingNumber!,
        status: 'shipped',
        createdAt: new Date(),
        shippedAt: new Date()
      });

    } else {
      console.error(`Shipment creation failed for order ${orderData.orderNumber}:`, shipmentResult.error);
      
      // Could implement fallback logic here - try next cheapest carrier
      // Or alert merchant about failed shipment
    }

  } catch (error) {
    console.error("Error processing ShipStation order:", error);
    
    // Could implement retry logic or alert system here
    console.error(`Failed to process order from ${resourceUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function calculateOrderWeight(items: any[]): number {
  if (!items || items.length === 0) return 8;
  
  return items.reduce((total, item) => {
    const itemWeight = item.weight?.value || 4;
    const quantity = item.quantity || 1;
    return total + (itemWeight * quantity);
  }, 0);
}

export default router;