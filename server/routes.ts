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
        weight: item.weight?.value || 0.1,
        unitCode: "PCE",
      })) : [
        {
          ename: "General Merchandise",
          sku: "DEFAULT-001",
          price: 10.00,
          quantity: 1,
          weight: weight || 1,
          unitCode: "PCE",
        }
      ];

      // Determine channel code based on country
      const defaultChannelCode = shippingAddress.country === "CA" ? "CA002" : 
                                 shippingAddress.country === "US" ? "US001" : 
                                 "CA002";

      // Prepare Jiayou order data
      const jiayouOrderData = {
        channelCode: channelCode || defaultChannelCode,
        referenceNo: order.orderNumber,
        productType: 1,
        pweight: weight || 1,
        pieces: 1,
        insured: 0,
        shipMode: "DDU",
        consigneeName: shippingAddress.name,
        consigneeCompany: shippingAddress.company || "",
        consigneeCountryCode: shippingAddress.country || "US",
        consigneeProvince: shippingAddress.state || "",
        consigneeCity: shippingAddress.city || "",
        consigneeAddress: `${shippingAddress.street1} ${shippingAddress.street2 || ""}`.trim(),
        consigneePostcode: shippingAddress.postalCode || "",
        consigneePhone: shippingAddress.phone || "",
        consigneeEmail: order.customerEmail || "",
        shipperName: "Sender Name",
        shipperCompany: "Sender Company",
        shipperCountryCode: "CN",
        shipperProvince: "guangdong",
        shipperCity: "shenzhen",
        shipperAddress: "Default sender address",
        shipperPostcode: "518000",
        shipperPhone: "13800138000",
        currencyCode: "USD",
        returnLabel: "1",
        apiOrderItemList,
      };

      // Create order with Jiayou
      console.log("Sending to Jiayou API:", JSON.stringify(jiayouOrderData, null, 2));
      const jiayouResponse = await jiayouService.createOrder(jiayouOrderData);
      console.log("Jiayou API response:", jiayouResponse);

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
        channelCode: channelCode || "CA002",
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
