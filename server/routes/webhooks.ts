import express from "express";
import crypto from "crypto";
import { storage } from "../storage";

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

// ShipStation webhook endpoint for order updates - MIDDLEWARE ENGINE
router.post("/shipstation/orders", async (req, res) => {
  try {
    const { resource_url, resource_type } = req.body;

    if (resource_type !== 'ORDER_NOTIFY') {
      return res.json({ message: "Webhook type not handled" });
    }

    console.log(`\n📨 ShipStation webhook: ${resource_type} - ${resource_url}`);

    // Extract order ID from resource URL
    // URL format: https://ssapi.shipstation.com/orders/{orderId}
    const orderIdMatch = resource_url.match(/\/orders\/(\d+)/);
    if (!orderIdMatch) {
      console.error('Could not extract order ID from resource URL:', resource_url);
      return res.status(400).json({ error: "Invalid resource URL format" });
    }

    const orderId = parseInt(orderIdMatch[1]);
    console.log(`🎯 Processing order ID: ${orderId}`);

    // Import the middleware engine dynamically to avoid circular imports
    const { middlewareEngine } = await import('../services/middleware-engine');
    
    // Process the order through middleware (async, don't wait)
    setImmediate(async () => {
      try {
        const result = await middlewareEngine.processOrder(orderId);
        console.log(`\n✅ Middleware result for order ${orderId}:`, {
          success: result.success,
          decision: result.decision.reason,
          useQuikpik: result.decision.useQuikpik,
          trackingNumber: result.trackingNumber
        });
      } catch (error) {
        console.error(`❌ Middleware failed for order ${orderId}:`, error);
      }
    });

    // Respond immediately to ShipStation webhook
    res.json({ 
      success: true, 
      message: "ShipStation webhook received and processing started",
      orderId: orderId,
      timestamp: new Date().toISOString()
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

export default router;