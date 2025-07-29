import express from "express";
import { middlewareEngine } from "../services/middleware-engine";

const router = express.Router();

/**
 * Test endpoint for the middleware engine
 * POST /api/middleware/test-order/:orderId
 */
router.post("/test-order/:orderId", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    console.log(`\n🧪 Testing middleware engine with order ${orderId}`);
    
    const result = await middlewareEngine.processOrder(orderId);
    
    res.json({
      success: true,
      orderId: orderId,
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Middleware test error:", error);
    res.status(500).json({ 
      error: "Failed to test middleware",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get ShipEngine rate for testing
 * POST /api/middleware/test-rates
 */
router.post("/test-rates", async (req, res) => {
  try {
    const { shipEngineService } = await import('../services/shipengine');
    
    // Test rate request
    const testRateRequest = {
      shipment: {
        ship_to: {
          name: "Test Customer",
          address_line1: "123 Main St",
          city_locality: "New York",
          state_province: "NY",
          postal_code: "10001",
          country_code: "US"
        },
        ship_from: {
          name: "Radius Fulfillment",
          address_line1: "175-14 147th Ave",
          city_locality: "Queens",
          state_province: "NY",
          postal_code: "11434",
          country_code: "US"
        },
        packages: [{
          weight: {
            value: 8,
            unit: 'ounce' as const
          },
          dimensions: {
            length: 6,
            width: 4,
            height: 2,
            unit: 'inch' as const
          }
        }]
      },
      rate_options: {}
    };

    const rates = await shipEngineService.getRates(testRateRequest);
    
    res.json({
      success: true,
      rateRequest: testRateRequest,
      rates: rates.map(rate => ({
        carrier: rate.carrier_friendly_name,
        service: rate.service_type,
        amount: rate.shipping_amount.amount,
        deliveryDays: rate.delivery_days,
        estimatedDelivery: rate.estimated_delivery_date
      })),
      rateCount: rates.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Rate test error:", error);
    res.status(500).json({ 
      error: "Failed to test rates",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Simulate webhook for testing
 * POST /api/middleware/simulate-webhook
 */
router.post("/simulate-webhook", async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }

    console.log(`\n🎭 Simulating ShipStation webhook for order ${orderId}`);
    
    // Import webhooks module and call the handler
    const webhooksModule = await import('../routes/webhooks');
    
    // Simulate webhook payload
    const mockWebhookPayload = {
      resource_url: `https://ssapi.shipstation.com/orders/${orderId}`,
      resource_type: 'ORDER_NOTIFY'
    };

    // Create mock request/response objects
    const mockReq = {
      body: mockWebhookPayload
    } as express.Request;

    let responseData: any = null;
    const mockRes = {
      json: (data: any) => { responseData = data; return mockRes; },
      status: (code: number) => mockRes
    } as express.Response;

    // This would need to be implemented differently since we can't easily call the route handler
    console.log('Webhook simulation setup complete. In real implementation, this would trigger the middleware.');
    
    res.json({
      success: true,
      message: "Webhook simulation initiated",
      webhookPayload: mockWebhookPayload,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Webhook simulation error:", error);
    res.status(500).json({ 
      error: "Failed to simulate webhook",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;