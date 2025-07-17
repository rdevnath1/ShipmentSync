import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ShipStationService } from "./services/shipstation";
import { JiayouService } from "./services/jiayou";
import { LabelProcessor } from "./services/labelProcessor";
import { TrackingTransform } from "./utils/trackingTransform";
import { insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import fs from 'fs/promises';
import path from 'path';

export async function registerRoutes(app: Express): Promise<Server> {
  const shipStationService = new ShipStationService();
  const jiayouService = new JiayouService();
  const labelProcessor = new LabelProcessor();

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
          // Convert QP tracking number back to GV format for Jiayou API
          const jiayouTrackingNumber = TrackingTransform.transformToGV(order.trackingNumber);
          console.log(`Label retrieval: ${order.trackingNumber} → ${jiayouTrackingNumber} (for Jiayou API)`);
          
          // Use enhanced label retrieval with retry logic
          const labelResponse = await jiayouService.getLabelWithRetry(jiayouTrackingNumber, 3);
          
          if (labelResponse && labelResponse.code === 1 && labelResponse.data && labelResponse.data.length > 0) {
            const originalLabelUrl = labelResponse.data[0].labelPath;
            
            if (originalLabelUrl) {
              // Process the label with Quikpik branding
              const labelProcessor = new LabelProcessor();
              const processedLabelBuffer = await labelProcessor.processLabelWithLogo(
                originalLabelUrl, 
                jiayouTrackingNumber
              );
              
              // Save the processed label
              labelPath = await labelProcessor.saveLabelToFile(processedLabelBuffer, jiayouTrackingNumber);
              
              // Update the order with the processed label path
              await storage.updateOrder(orderId, { labelPath });
              console.log(`Label processed and saved for order ${orderId}: ${labelPath}`);
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

      // Mark as shipped in ShipStation (trackingNumber is already in QP format from database)
      const updateResult = await shipStationService.markAsShipped(
        parseInt(order.shipstationOrderId),
        order.trackingNumber, // Already in QP format
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

      // ChatGPT's critical suggestion: Only proceed if Jiayou succeeded
      if (!jiayouResponse || jiayouResponse.code !== 1) {
        console.error("❌ Jiayou failed - NOT calling ShipStation");
        
        // Translate common Chinese error messages to English
        let errorMessage = jiayouResponse?.message || "Unknown error from Jiayou";
        
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
        if (errorMessage === jiayouResponse?.message && /[\u4e00-\u9fff]/.test(errorMessage)) {
          errorMessage = `Shipping service error: ${jiayouResponse.message}. Please check your address format and try again.`;
        }

        return res.status(400).json({ error: errorMessage });
      }

      // If we get here, Jiayou succeeded (code === 1)
      console.log("✅ Jiayou succeeded - proceeding with label processing and ShipStation update");

      // Process the shipping label with logo if labelPath is available
      let processedLabelUrl = jiayouResponse.data.labelPath;
      if (jiayouResponse.data.labelPath) {
        try {
          console.log("Processing shipping label with company logo...");
          const processedLabelPath = await labelProcessor.processAndSaveLabel(
            jiayouResponse.data.labelPath,
            jiayouResponse.data.trackingNo
          );
          
          // Generate the URL for the processed label
          processedLabelUrl = labelProcessor.generateLabelUrl(jiayouResponse.data.trackingNo);
          console.log(`Label processed successfully: ${processedLabelUrl}`);
        } catch (error) {
          console.error("Error processing label with logo:", error);
          // Continue with original label if processing fails
          console.log("Using original label from Jiayou");
        }
      }

      // Transform tracking number from GV to QP format for dashboard and ShipStation
      const originalTrackingNo = jiayouResponse.data.trackingNo;
      const qpTrackingNumber = TrackingTransform.transformToQP(originalTrackingNo);
      
      console.log(`Tracking number transformation: ${originalTrackingNo} → ${qpTrackingNumber}`);

      // Update order with shipment data and mark as shipped
      const shipmentUpdate = {
        jiayouOrderId: jiayouResponse.data.orderId,
        trackingNumber: qpTrackingNumber, // Use QP format for dashboard display
        markNo: jiayouResponse.data.markNo,
        labelPath: processedLabelUrl, // Use processed label with logo
        channelCode: defaultChannelCode || "US001",
        serviceType: "standard",
        weight: weight?.toString() || "8",
        dimensions: dimensions || null,
        status: "shipped",
      };

      const updatedOrder = await storage.updateOrder(order.id, shipmentUpdate);

      // Update ShipStation with tracking info using mark as shipped (send QP format)
      if (order.shipstationOrderId) {
        const updateResult = await shipStationService.markAsShipped(
          parseInt(order.shipstationOrderId),
          qpTrackingNumber, // Send QP format to ShipStation
          processedLabelUrl // Pass the processed label URL with logo
        );
        
        if (updateResult) {
          console.log(`Successfully marked ShipStation order ${order.shipstationOrderId} as shipped with QP tracking: ${qpTrackingNumber}`);
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
      
      // Transform QP tracking number back to GV format for Jiayou API
      const jiayouTrackingNumber = TrackingTransform.transformToGV(trackingNumber);
      
      console.log(`Tracking lookup: ${trackingNumber} → ${jiayouTrackingNumber} (for Jiayou API)`);
      
      const trackingData = await jiayouService.getTracking(jiayouTrackingNumber);
      
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

  // Debug endpoint to verify Jiayou order synchronization
  app.get("/api/debug/jiayou/:orderId", async (req, res) => {
    try {
      const { verifyJiayouOrder } = await import('./debug-jiayou.js');
      const orderId = parseInt(req.params.orderId);
      const result = await verifyJiayouOrder(orderId);
      res.json(result);
    } catch (error) {
      console.error("Error in Jiayou debug:", error);
      res.status(500).json({ error: "Failed to debug Jiayou order" });
    }
  });

  // Debug endpoint to check all orders
  app.get("/api/debug/jiayou-all", async (req, res) => {
    try {
      const { debugAllOrders } = await import('./debug-jiayou.js');
      const results = await debugAllOrders();
      res.json(results);
    } catch (error) {
      console.error("Error in Jiayou debug all:", error);
      res.status(500).json({ error: "Failed to debug all orders" });
    }
  });

  // Debug endpoint to test label retrieval
  app.post("/api/debug/jiayou-label", async (req, res) => {
    try {
      const { trackingNumber } = req.body;
      
      if (!trackingNumber) {
        return res.status(400).json({ error: "Missing trackingNumber" });
      }
      
      console.log(`Debug: Testing label retrieval for ${trackingNumber}`);
      
      // Test with enhanced retry logic
      const labelResponse = await jiayouService.getLabelWithRetry(trackingNumber, 3);
      
      res.json({
        trackingNumber,
        labelResponse,
        message: "Label retrieval test completed"
      });
    } catch (error) {
      console.error("Error in label debug:", error);
      res.status(500).json({ error: "Failed to debug label retrieval" });
    }
  });

  // Serve processed shipping labels with logo
  app.get("/api/labels/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Validate filename to prevent directory traversal
      if (!filename.match(/^[a-zA-Z0-9_-]+\.pdf$/)) {
        return res.status(400).json({ error: "Invalid filename format" });
      }
      
      const labelsDir = path.join(process.cwd(), 'labels');
      const filePath = path.join(labelsDir, filename);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({ error: "Label file not found" });
      }
      
      // Set CORS headers for proper access
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      // Set appropriate headers for PDF viewing/download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Stream the file
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
      
    } catch (error) {
      console.error("Error serving label:", error);
      res.status(500).json({ error: "Failed to serve label" });
    }
  });

  // API Key Management Routes
  app.get("/api/api-keys", async (req, res) => {
    try {
      const apiKeys = await storage.getApiKeys();
      
      // Don't expose the secret in the response
      const sanitizedKeys = apiKeys.map(key => ({
        ...key,
        keySecret: `${key.keySecret.substring(0, 8)}...`
      }));
      
      res.json(sanitizedKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.post("/api/api-keys", async (req, res) => {
    try {
      const { name, permissions } = req.body;
      
      // Generate secure API key components
      const keyId = `sk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const keySecret = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      const apiKeyData = {
        name,
        keyId,
        keySecret,
        permissions,
        isActive: true,
      };
      
      const apiKey = await storage.createApiKey(apiKeyData);
      
      res.json(apiKey);
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  app.put("/api/api-keys/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, permissions, isActive } = req.body;
      
      const apiKey = await storage.updateApiKey(id, {
        name,
        permissions,
        isActive,
      });
      
      res.json(apiKey);
    } catch (error) {
      console.error("Error updating API key:", error);
      res.status(500).json({ error: "Failed to update API key" });
    }
  });

  app.delete("/api/api-keys/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteApiKey(id);
      res.json({ message: "API key deleted successfully" });
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
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
