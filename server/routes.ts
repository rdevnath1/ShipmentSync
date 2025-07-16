import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ShipStationService } from "./services/shipstation";
import { JiayouService } from "./services/jiayou";
import { insertOrderSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const shipStationService = new ShipStationService();
  const jiayouService = new JiayouService();

  // Get all orders (pending and shipped)
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get pending orders (not yet shipped)
  app.get("/api/orders/pending", async (req, res) => {
    try {
      const orders = await storage.getPendingOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending orders" });
    }
  });

  // Delete order
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      // Check if order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if order has associated shipments
      const shipment = await storage.getShipmentByOrderId(orderId);
      if (shipment) {
        return res.status(400).json({ error: "Cannot delete order with associated shipments" });
      }

      // Delete the order (implement this in storage)
      await storage.deleteOrder(orderId);
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Update order
  app.put("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { customerName, customerEmail, customerPhone, shippingAddress, totalAmount } = req.body;
      
      const order = await storage.getOrder(parseInt(id));
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const updatedOrder = await storage.updateOrder(parseInt(id), { 
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        totalAmount
      });
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ error: "Failed to update order" });
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

  // Create manual order
  app.post("/api/orders/manual", async (req, res) => {
    try {
      const orderData = {
        orderNumber: req.body.orderNumber,
        referenceNumber: `MANUAL-${Date.now()}`,
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone,
        shippingAddress: req.body.shippingAddress,
        billingAddress: req.body.shippingAddress, // Use shipping as billing for manual orders
        items: req.body.items,
        totalAmount: req.body.totalAmount,
        currency: "USD",
        status: "pending",
      };

      const validatedOrder = insertOrderSchema.parse(orderData);
      const createdOrder = await storage.createOrder(validatedOrder);
      
      res.json(createdOrder);
    } catch (error) {
      console.error("Error creating manual order:", error);
      res.status(500).json({ error: "Failed to create manual order" });
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

  // Get all shipments (shipped orders)
  app.get("/api/shipments", async (req, res) => {
    try {
      const shipments = await storage.getShippedOrders();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  });

  // Print label for shipment
  app.post("/api/shipments/:id/print", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (!order.trackingNumber) {
        return res.status(400).json({ error: "No tracking number available for this order" });
      }

      // If label path is empty, try to get it from Jiayou using the tracking number
      let labelPath = order.labelPath;
      if (!labelPath) {
        console.log(`No label path found for order ${orderId}, requesting from Jiayou...`);
        try {
          const labelResponse = await jiayouService.printLabel([order.trackingNumber]);
          if (labelResponse && labelResponse.code === 1 && labelResponse.data && labelResponse.data.length > 0) {
            labelPath = labelResponse.data[0].labelPath;
            
            // Update the order with the new label path
            if (labelPath) {
              await storage.updateOrder(orderId, { labelPath });
              console.log(`Updated order ${orderId} with label path: ${labelPath}`);
            }
          } else {
            console.error("Failed to get label from Jiayou:", labelResponse);
          }
        } catch (jiayouError) {
          console.error("Error requesting label from Jiayou:", jiayouError);
        }
      }

      if (!labelPath) {
        return res.status(400).json({ error: "No label available for this order. The label may not have been generated yet." });
      }

      // Return the label path for frontend to open
      res.json({ 
        labelPath: labelPath,
        trackingNumber: order.trackingNumber 
      });
    } catch (error) {
      console.error("Error printing label:", error);
      res.status(500).json({ error: "Failed to print label" });
    }
  });

  // Test ShipStation mark as shipped for existing shipment
  app.post("/api/shipments/:id/mark-shipped", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (!order.shipstationOrderId) {
        return res.status(400).json({ error: "Order has no ShipStation order ID" });
      }

      if (!order.trackingNumber) {
        return res.status(400).json({ error: "Order has no tracking number" });
      }

      // Mark as shipped in ShipStation
      const updateResult = await shipStationService.markAsShipped(
        parseInt(order.shipstationOrderId),
        order.trackingNumber,
        order.labelPath
      );

      if (updateResult) {
        res.json({ 
          message: "Successfully marked as shipped in ShipStation",
          trackingNumber: order.trackingNumber,
          shipstationOrderId: order.shipstationOrderId
        });
      } else {
        res.status(500).json({ error: "Failed to mark as shipped in ShipStation" });
      }
    } catch (error) {
      console.error("Error marking as shipped:", error);
      res.status(500).json({ error: "Failed to mark as shipped" });
    }
  });



  // Create shipment with Jiayou
  app.post("/api/shipments/create", async (req, res) => {
    try {
      const { orderId, weight, dimensions } = req.body;
      const { length = 10, width = 10, height = 2 } = dimensions ?? {};
      console.log("Create shipment request:", { orderId, weight, dimensions });

      // Get order details
      const order = await storage.getOrder(orderId);
      console.log("Found order:", order);
      if (!order) {
        console.log("Order not found, available orders:", await storage.getAllOrders());
        return res.status(404).json({ error: "Order not found" });
      }

      const shippingAddress = order.shippingAddress as any;
      const items = order.items as any[];

      // Convert weight from ounces to kg with 3 decimal precision
      const convertOzToKg = (oz: number) => Math.round(Math.max(0.001, oz * 0.0283495) * 1000) / 1000;
      
      // Only use US001 for US domestic shipping
      const defaultChannelCode = "US001";

      // Check for PO Box addresses before hitting Jiayou API
      const addressLine = `${shippingAddress.street1} ${shippingAddress.street2 || ""}`.trim();
      if (/^\s*P\.?\s*O\.?\s*BOX/i.test(addressLine)) {
        return res.status(400).json({ 
          error: `Address "${addressLine}" is a PO Box. US001 can only deliver to street addresses. Please provide a physical delivery address.` 
        });
      }

      // Check for invalid address formats that Jiayou rejects
      if (/^\s*\d+\s*$/.test(shippingAddress.street1)) {
        return res.status(400).json({ 
          error: `Address "${shippingAddress.street1}" is invalid. Street address cannot contain only numbers. Please provide a complete street address (e.g., "123 Main Street").` 
        });
      }

      // Check postal code coverage for the channel
      console.log("Checking postal code coverage...");
      const kgWeight = convertOzToKg(weight || 8); // 8 oz = 0.227 kg safe default (above 0.05kg minimum)

      // Prepare item list - use default item if no items in order
      const apiOrderItemList = items.length > 0 ? items.map(item => ({
        ename: item.name,
        sku: item.sku,
        price: item.unitPrice,
        quantity: item.quantity,
        weight: convertOzToKg(item.weight?.value || 0.1),
        unitCode: "PCE",
      })) : [
        {
          ename: "General Merchandise",
          sku: "DEFAULT-001",
          price: 10.00,
          quantity: 1,
          weight: kgWeight,
          unitCode: "PCE",
        }
      ];
      const coverageCheck = await jiayouService.checkPostalCodeCoverage(
        defaultChannelCode, // Always use US001
        shippingAddress.postalCode || "",
        { length, width, height },
        kgWeight
      );
      console.log("Coverage check result:", coverageCheck);
      console.dir(coverageCheck, { depth: null });

      if (coverageCheck.code === 0) {
        return res.status(400).json({ 
          error: `Postal code ${shippingAddress.postalCode} is not supported by channel ${defaultChannelCode}.`
        });
      }

      if (
        coverageCheck.code === 1 &&
        coverageCheck.data[0].errMsg &&
        coverageCheck.data[0].errMsg.includes("未维护报价")
      ) {
        return res.status(400).json({
          error: `Channel ${defaultChannelCode} has no price sheet – ask Jiayou or switch to UP008.`
        });
      }

      // Check if coverage check was successful (has totalFee and no errMsg)
      if (coverageCheck.code === 1 && coverageCheck.data[0].totalFee && !coverageCheck.data[0].errMsg) {
        console.log(`✓ Coverage check passed for ${shippingAddress.postalCode}. Cost: $${coverageCheck.data[0].totalFee}`);
      } else if (
        coverageCheck.code === 1 &&
        coverageCheck.data[0].errMsg &&
        !coverageCheck.data[0].errMsg.includes("未维护报价")
      ) {
        // Check if this is specifically a PO Box ZIP code issue (be more specific)
        const isPOBoxError = /PO\s*BOX/i.test(coverageCheck.data[0].errMsg) || 
                            coverageCheck.data[0].errMsg.includes("不支持PO BOX");
        
        // Only classify as PO Box if it's specifically mentioned in the error message or if it's the known PO Box ZIP 10008
        if (isPOBoxError || (shippingAddress.postalCode === '10008' && coverageCheck.data[0].errMsg.includes("不在渠道分区范围内"))) {
          return res.status(400).json({ 
            error: `ZIP ${shippingAddress.postalCode} is a PO Box ZIP code. US001 can only deliver to street addresses. Please provide a physical delivery address.` 
          });
        }
        
        // For coverage issues, log warning but proceed with shipment creation
        // since customer service confirmed coverage exists
        if (coverageCheck.data[0].errMsg.includes("不在渠道分区范围内")) {
          console.warn(`⚠️  Coverage check API returned error for ${shippingAddress.postalCode}, but proceeding with shipment creation since customer service confirmed coverage exists.`);
          console.warn(`Coverage API error: ${coverageCheck.data[0].errMsg}`);
        } else {
          // For other errors (weight, dimensions, etc.), still fail
          return res.status(400).json({ error: coverageCheck.data[0].errMsg });
        }
      }

      // Verify address first
      console.log("Verifying address...");
      const addressVerification = await jiayouService.verifyAddress(
        shippingAddress.postalCode || "",
        shippingAddress.country || "US",
        shippingAddress.state || "",
        shippingAddress.city || ""
      );
      console.log("Address verification result:", addressVerification);

      if (addressVerification.code === 0) {
        return res.status(400).json({ error: `Address verification failed: ${addressVerification.message}` });
      }

      // Generate unique reference number
      const uniqueReferenceNo = `${order.orderNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Prepare Jiayou order data with fromAddressId for hub injection
      const jiayouOrderData = {
        channelCode: defaultChannelCode, // Always use US001
        referenceNo: uniqueReferenceNo,
        productType: 1,
        pweight: kgWeight,
        pieces: 1,
        insured: 0,
        fromAddressId: "JFK", // Hub injection for US001

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
        shipperProvince: "NY",
        shipperCity: "New York",
        shipperAddress: "JFK Airport Fulfillment Center",
        shipperPostcode: "11430",
        shipperPhone: "+1-718-244-4444",
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
          referenceNo: `${order.orderNumber}-${Date.now()}-${attempts}-${Math.random().toString(36).substr(2, 9)}`
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
        // Translate common Chinese error messages to English
        let errorMessage = jiayouResponse.message;
        
        // Common error message translations
        const errorTranslations = {
          '收件人地址【.*】不能只包含数字！': 'Street address cannot contain only numbers. Please provide a complete street address (e.g., "123 Main Street").',
          '收件人地址格式不正确': 'Recipient address format is incorrect. Please provide a valid street address.',
          '收件人姓名不能为空': 'Recipient name cannot be empty.',
          '收件人邮编不能为空': 'Recipient postal code cannot be empty.',
          '收件人电话不能为空': 'Recipient phone number cannot be empty.',
          '收件人城市不能为空': 'Recipient city cannot be empty.',
          '收件人州/省不能为空': 'Recipient state/province cannot be empty.',
          '不在渠道分区范围内': 'This postal code is not supported by the US001 channel.',
          '获取单号中，请稍后重试': 'Getting tracking number, please try again later.',
          '重量不能为空': 'Weight cannot be empty.',
          '尺寸不能为空': 'Dimensions cannot be empty.'
        };

        // Try to translate the error message
        for (const [chinesePattern, englishTranslation] of Object.entries(errorTranslations)) {
          if (new RegExp(chinesePattern).test(errorMessage)) {
            errorMessage = englishTranslation;
            break;
          }
        }

        // If no translation found, keep original message but add helpful note
        if (errorMessage === jiayouResponse.message && /[\u4e00-\u9fff]/.test(errorMessage)) {
          errorMessage = `Shipping service error: ${jiayouResponse.message}. Please check your address format and try again.`;
        }

        return res.status(400).json({ error: errorMessage });
      }

      // Update order with shipment data and mark as shipped
      const shipmentUpdate = {
        jiayouOrderId: jiayouResponse.data.orderId,
        trackingNumber: jiayouResponse.data.trackingNo,
        markNo: jiayouResponse.data.markNo,
        labelPath: jiayouResponse.data.labelPath,
        channelCode: defaultChannelCode || "US001",
        serviceType: "standard",
        weight: weight?.toString() || "8",
        dimensions: dimensions || null,
        status: "shipped",
      };

      const updatedOrder = await storage.updateOrder(order.id, shipmentUpdate);

      // Update ShipStation with tracking info using mark as shipped
      if (order.shipstationOrderId) {
        const updateResult = await shipStationService.markAsShipped(
          parseInt(order.shipstationOrderId),
          jiayouResponse.data.trackingNo,
          jiayouResponse.data.labelPath // Pass the Jiayou label URL
        );
        
        if (updateResult) {
          console.log(`Successfully marked ShipStation order ${order.shipstationOrderId} as shipped`);
        } else {
          console.error(`Failed to mark ShipStation order ${order.shipstationOrderId} as shipped`);
        }
      }

      res.json({
        message: "Shipment created successfully",
        order: updatedOrder,
        jiayouResponse: jiayouResponse.data,
      });
    } catch (error) {
      console.error("Error creating shipment:", error);
      res.status(500).json({ error: "Failed to create shipment" });
    }
  });

  // Update shipment (actually updates the order with shipment data)
  app.put("/api/shipments/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { trackingNumber, channelCode, serviceType, weight, dimensions, status, shippingAddress } = req.body;
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Update order with shipment data and address if provided
      const updateData = {
        trackingNumber,
        channelCode: channelCode || "US001",
        serviceType: serviceType || "standard",
        weight: weight?.toString(),
        dimensions,
        status,
        ...(shippingAddress && { shippingAddress }),
      };

      const updatedOrder = await storage.updateOrder(orderId, updateData);
      
      res.json({
        message: "Shipment updated successfully",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Error updating shipment:", error);
      res.status(500).json({ error: "Failed to update shipment" });
    }
  });

  // Get tracking information
  app.get("/api/tracking/:trackingNumber", async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      
      const trackingData = await jiayouService.getTracking(trackingNumber);
      
      // If tracking is not available yet, return a user-friendly message
      if (trackingData.code === 0) {
        res.json({
          code: 0,
          message: "Tracking information not available yet. New shipments may take a few hours to appear in the tracking system.",
          data: null
        });
        return;
      }
      
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

  // Check postal code coverage
  app.post("/api/jiayou/check-coverage", async (req, res) => {
    try {
      const { postCode, dimensions, weight } = req.body;
      
      const coverage = await jiayouService.checkPostalCodeCoverage(
        "US001", // Always use US001
        postCode,
        dimensions || { length: 10, width: 10, height: 2 },
        weight || 0.2
      );
      
      res.json(coverage);
    } catch (error) {
      console.error("Error checking coverage:", error);
      res.status(500).json({ error: "Failed to check coverage" });
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
      const shipments = orders.filter(order => order.status === 'shipped');
      
      const stats = {
        totalOrders: orders.length,
        activeShipments: shipments.filter(s => s.status === "shipped").length,
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
