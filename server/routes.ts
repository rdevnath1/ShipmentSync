import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ShipStationService } from "./services/shipstation";
import { JiayouService } from "./services/jiayou";
import { insertOrderSchema, insertShipmentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const shipStationService = new ShipStationService();
  const jiayouService = new JiayouService();

  // Get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Update order address (for testing)
  app.put("/api/orders/:id/address", async (req, res) => {
    try {
      const { id } = req.params;
      const { shippingAddress } = req.body;
      
      const order = await storage.getOrder(parseInt(id));
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const updatedOrder = await storage.updateOrder(parseInt(id), { 
        shippingAddress: shippingAddress 
      });
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order address" });
    }
  });

  // Pull orders from ShipStation
  app.post("/api/orders/pull-shipstation", async (req, res) => {
    try {
      const shipStationOrders = await shipStationService.getOrders();
      const createdOrders = [];

      for (const ssOrder of shipStationOrders) {
        // Check if order already exists
        const existingOrder = await storage.getOrderByShipstationId(ssOrder.orderId.toString());
        if (existingOrder) continue;

        // Create new order
        const orderData = {
          shipstationOrderId: ssOrder.orderId.toString(),
          orderNumber: ssOrder.orderNumber,
          referenceNumber: ssOrder.orderKey,
          customerName: ssOrder.shipTo.name,
          customerEmail: ssOrder.customerEmail,
          customerPhone: ssOrder.shipTo.phone,
          shippingAddress: ssOrder.shipTo,
          billingAddress: ssOrder.billTo,
          items: ssOrder.items,
          totalAmount: ssOrder.orderTotal.toString(),
          currency: "USD",
          status: "pending",
        };

        const validatedOrder = insertOrderSchema.parse(orderData);
        const createdOrder = await storage.createOrder(validatedOrder);
        createdOrders.push(createdOrder);
      }

      res.json({ 
        message: `Successfully pulled ${createdOrders.length} new orders from ShipStation`,
        orders: createdOrders
      });
    } catch (error) {
      console.error("Error pulling orders from ShipStation:", error);
      res.status(500).json({ error: "Failed to pull orders from ShipStation" });
    }
  });

  // Get all shipments
  app.get("/api/shipments", async (req, res) => {
    try {
      const shipments = await storage.getAllShipments();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  });

  // Get available Jiayou channel codes
  app.get("/api/jiayou/channels", async (req, res) => {
    try {
      const channels = await jiayouService.getChannelCodes();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch channel codes" });
    }
  });

  // Get channel delivery range/coverage info
  app.get("/api/jiayou/channel-info", async (req, res) => {
    try {
      const { channelCode } = req.query;
      if (!channelCode) {
        return res.status(400).json({ error: "Channel code is required" });
      }
      
      const channelInfo = await jiayouService.getChannelInfo(channelCode as string);
      res.json(channelInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch channel info" });
    }
  });

  // Create shipment with Jiayou
  app.post("/api/shipments/create", async (req, res) => {
    try {
      const { orderId, channelCode, serviceType, weight, dimensions } = req.body;
      console.log("Create shipment request:", { orderId, channelCode, serviceType, weight, dimensions });

      // Get order details
      const order = await storage.getOrder(orderId);
      console.log("Found order:", order);
      if (!order) {
        console.log("Order not found, available orders:", await storage.getAllOrders());
        return res.status(404).json({ error: "Order not found" });
      }

      const shippingAddress = order.shippingAddress as any;
      const items = order.items as any[];

      // Prepare item list - use default item if no items in order
      const apiOrderItemList = items.length > 0 ? items.map(item => ({
        ename: item.name,
        sku: item.sku,
        price: item.unitPrice,
        quantity: item.quantity,
        weight: Math.round(Math.max(0.001, (item.weight?.value || 0.1) * 0.0283495) * 1000) / 1000, // Convert ounces to kg, round to 3 decimals
        unitCode: "PCE",
      })) : [
        {
          ename: "General Merchandise",
          sku: "DEFAULT-001",
          price: 10.00,
          quantity: 1,
          weight: Math.round(Math.max(0.001, (weight || 1) * 0.0283495) * 1000) / 1000, // Convert ounces to kg, round to 3 decimals
          unitCode: "PCE",
        }
      ];

      // Only use US001 for US domestic shipping
      const defaultChannelCode = "US001";

      // Prepare Jiayou order data
      const jiayouOrderData = {
        channelCode: channelCode || defaultChannelCode,
        referenceNo: `${order.orderNumber}-${Date.now()}`,
        productType: 1,
        pweight: Math.round(Math.max(0.001, (weight || 1) * 0.0283495) * 1000) / 1000, // Convert ounces to kg, round to 3 decimals
        pieces: 1,
        insured: 0,

        consigneeName: shippingAddress.name,
        consigneeCompany: shippingAddress.company || "",
        consigneeCountryCode: shippingAddress.country || "US",
        consigneeProvince: shippingAddress.state || "",
        consigneeCity: shippingAddress.city || "",
        consigneeAddress: `${shippingAddress.street1} ${shippingAddress.street2 || ""}`.trim(),
        consigneePostcode: shippingAddress.postalCode || "",
        consigneePhone: shippingAddress.phone || "+1-555-000-0000",
        consigneeEmail: order.customerEmail || "",
        shipperName: "US Fulfillment Center",
        shipperCountryCode: "US",
        shipperProvince: "CA",
        shipperCity: "Los Angeles",
        shipperAddress: "1234 Fulfillment Center Blvd",
        shipperPostcode: "90001",
        shipperPhone: "+1-555-123-4567",
        currencyCode: "USD",
        apiOrderItemList,
      };

      // Add field validation
      const requiredFields = ['consigneeName', 'consigneeCountryCode', 'consigneeProvince', 'consigneeCity', 'consigneeAddress', 'consigneePostcode', 'consigneePhone'];
      for (const field of requiredFields) {
        if (!jiayouOrderData[field] || jiayouOrderData[field].trim() === '') {
          return res.status(400).json({ error: `Required field ${field} is missing or empty` });
        }
      }

      // Implement retry logic for error 100001
      let jiayouResponse;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        attempts++;
        
        // Make unique reference number for each attempt
        const currentOrderData = {
          ...jiayouOrderData,
          referenceNo: `${order.orderNumber}-${Date.now()}-${attempts}`
        };
        
        console.log(`Attempt ${attempts}: Sending to Jiayou API:`, JSON.stringify(currentOrderData, null, 2));
        jiayouResponse = await jiayouService.createOrder(currentOrderData);
        console.log(`Attempt ${attempts}: Jiayou API response:`, jiayouResponse);
        
        if (jiayouResponse.code === 1) {
          console.log(`Success on attempt ${attempts}`);
          break;
        }
        
        // Check if it's the "getting tracking number" error (100001)
        if (jiayouResponse.message.includes('获取单号中，请稍后重试') || jiayouResponse.message.includes('100001')) {
          console.log(`Attempt ${attempts}: Getting tracking number error, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          continue;
        }
        
        // If it's a different error, don't retry
        console.log(`Attempt ${attempts}: Different error, not retrying:`, jiayouResponse.message);
        break;
      }

      if (jiayouResponse.code !== 1) {
        return res.status(400).json({ error: jiayouResponse.message });
      }

      // Create shipment record
      const shipmentData = {
        orderId: order.id,
        jiayouOrderId: jiayouResponse.data.orderId,
        trackingNumber: jiayouResponse.data.trackingNo,
        markNo: jiayouResponse.data.markNo,
        labelPath: jiayouResponse.data.labelPath,
        channelCode: channelCode || "US001",
        serviceType: serviceType || "standard",
        weight: weight?.toString() || "1",
        dimensions: dimensions || null,
        status: "created",
      };

      const validatedShipment = insertShipmentSchema.parse(shipmentData);
      const createdShipment = await storage.createShipment(validatedShipment);

      // Update order status
      await storage.updateOrder(order.id, { status: "shipped" });

      // Update ShipStation with tracking info
      if (order.shipstationOrderId) {
        await shipStationService.updateOrderWithTracking(
          parseInt(order.shipstationOrderId),
          jiayouResponse.data.trackingNo
        );
      }

      res.json({
        message: "Shipment created successfully",
        shipment: createdShipment,
        jiayouResponse: jiayouResponse.data,
      });
    } catch (error) {
      console.error("Error creating shipment:", error);
      res.status(500).json({ error: "Failed to create shipment" });
    }
  });

  // Get tracking information
  app.get("/api/tracking/:trackingNumber", async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      
      const trackingData = await jiayouService.getTracking(trackingNumber);
      
      res.json(trackingData);
    } catch (error) {
      console.error("Error fetching tracking:", error);
      res.status(500).json({ error: "Failed to fetch tracking information" });
    }
  });

  // Get channel codes
  app.get("/api/jiayou/channels", async (req, res) => {
    try {
      const channels = await jiayouService.getChannelCodes();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channel codes:", error);
      res.status(500).json({ error: "Failed to fetch channel codes" });
    }
  });

  // Print label
  app.post("/api/labels/print", async (req, res) => {
    try {
      const { trackingNumbers } = req.body;
      
      if (!Array.isArray(trackingNumbers)) {
        return res.status(400).json({ error: "trackingNumbers must be an array" });
      }

      const labelData = await jiayouService.printLabel(trackingNumbers);
      
      res.json(labelData);
    } catch (error) {
      console.error("Error printing labels:", error);
      res.status(500).json({ error: "Failed to print labels" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      const shipments = await storage.getAllShipments();
      
      const stats = {
        totalOrders: orders.length,
        activeShipments: shipments.filter(s => s.status === "created" || s.status === "in_transit").length,
        deliveredToday: shipments.filter(s => {
          const today = new Date().toDateString();
          return s.status === "delivered" && new Date(s.updatedAt!).toDateString() === today;
        }).length,
        successRate: shipments.length > 0 ? 
          ((shipments.filter(s => s.status === "delivered").length / shipments.length) * 100).toFixed(1) : 
          "0.0",
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
