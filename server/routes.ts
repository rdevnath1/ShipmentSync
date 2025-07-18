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

  // Pull and sync orders from ShipStation
  app.post("/api/orders/pull-shipstation", async (req, res) => {
    try {
      const shipStationOrders = await shipStationService.getOrders();
      const createdOrders = [];
      const updatedOrders = [];

      for (const ssOrder of shipStationOrders) {
        // Check if order already exists
        const existingOrder = await storage.getOrderByShipstationId(ssOrder.orderId.toString());
        
        // Prepare order data from ShipStation
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
          status: existingOrder?.status || "pending", // Preserve existing shipment status
        };

        if (existingOrder) {
          // Update existing order with changes from ShipStation
          const hasChanges = (
            existingOrder.customerName !== orderData.customerName ||
            existingOrder.customerEmail !== orderData.customerEmail ||
            existingOrder.customerPhone !== orderData.customerPhone ||
            existingOrder.totalAmount !== orderData.totalAmount ||
            JSON.stringify(existingOrder.shippingAddress) !== JSON.stringify(orderData.shippingAddress) ||
            JSON.stringify(existingOrder.billingAddress) !== JSON.stringify(orderData.billingAddress) ||
            JSON.stringify(existingOrder.items) !== JSON.stringify(orderData.items)
          );

          if (hasChanges) {
            console.log(`Syncing changes for order ${ssOrder.orderNumber} from ShipStation`);
            
            // Only update fields that can be synced from ShipStation
            // Preserve shipping-related fields (trackingNumber, labelPath, etc.)
            const syncData = {
              customerName: orderData.customerName,
              customerEmail: orderData.customerEmail,
              customerPhone: orderData.customerPhone,
              shippingAddress: orderData.shippingAddress,
              billingAddress: orderData.billingAddress,
              items: orderData.items,
              totalAmount: orderData.totalAmount,
            };

            const updatedOrder = await storage.updateOrder(existingOrder.id, syncData);
            updatedOrders.push(updatedOrder);
          }
        } else {
          // Create new order
          const validatedOrder = insertOrderSchema.parse(orderData);
          const createdOrder = await storage.createOrder(validatedOrder);
          createdOrders.push(createdOrder);
        }
      }

      const totalSynced = createdOrders.length + updatedOrders.length;
      let message = '';
      
      if (createdOrders.length > 0 && updatedOrders.length > 0) {
        message = `Successfully synced ${totalSynced} orders: ${createdOrders.length} new, ${updatedOrders.length} updated`;
      } else if (createdOrders.length > 0) {
        message = `Successfully pulled ${createdOrders.length} new orders from ShipStation`;
      } else if (updatedOrders.length > 0) {
        message = `Successfully synced ${updatedOrders.length} updated orders from ShipStation`;
      } else {
        message = 'All orders are already up to date';
      }

      res.json({ 
        message,
        created: createdOrders.length,
        updated: updatedOrders.length,
        total: totalSynced,
        orders: [...createdOrders, ...updatedOrders]
      });
    } catch (error) {
      console.error("Error pulling/syncing orders from ShipStation:", error);
      res.status(500).json({ error: "Failed to pull/sync orders from ShipStation" });
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

      // Fix city field if it's just a postal code (common ShipStation data issue)
      let normalizedCity = shippingAddress.city || "";
      if (/^\d{5}(-\d{4})?$/.test(normalizedCity)) {
        // City field contains a ZIP code, use a mapping to get the actual city name
        const zipToCityMapping: { [key: string]: string } = {
          "32801": "Orlando",
          "32802": "Orlando", 
          "32803": "Orlando",
          "32804": "Orlando",
          "32805": "Orlando",
          "32806": "Orlando",
          "32807": "Orlando",
          "32808": "Orlando",
          "32809": "Orlando",
          "32810": "Orlando",
          "10001": "New York",
          "10002": "New York",
          "10003": "New York",
          "10004": "New York",
          "10005": "New York",
          "10006": "New York",
          "10007": "New York",
          "10009": "New York",
          "10010": "New York",
          "10011": "New York",
          "10012": "New York",
          "10013": "New York",
          "10014": "New York",
          "10016": "New York",
          "10017": "New York",
          "10018": "New York",
          "10019": "New York",
          "10020": "New York",
          "10021": "New York",
          "10022": "New York",
          "10023": "New York",
          "10024": "New York",
          "10025": "New York",
          "10026": "New York",
          "10027": "New York",
          "10028": "New York",
          "10029": "New York",
          "10030": "New York",
          "10031": "New York",
          "10032": "New York",
          "10033": "New York",
          "10034": "New York",
          "10035": "New York",
          "10036": "New York",
          "10037": "New York",
          "10038": "New York",
          "10039": "New York",
          "10040": "New York",
          "90210": "Beverly Hills",
          "90211": "Beverly Hills",
          "90212": "Beverly Hills",
          "90213": "Beverly Hills",
          "90401": "Santa Monica",
          "90402": "Santa Monica",
          "90403": "Santa Monica",
          "90404": "Santa Monica",
          "90405": "Santa Monica",
          "11101": "Long Island City",
          "11102": "Astoria",
          "11103": "Astoria",
          "11104": "Sunnyside",
          "11105": "Astoria",
          "11106": "Astoria",
          "11430": "Jamaica"
        };
        
        const mappedCity = zipToCityMapping[normalizedCity];
        if (mappedCity) {
          console.log(`Fixed city field: "${normalizedCity}" -> "${mappedCity}"`);
          normalizedCity = mappedCity;
        } else {
          // If we don't have a mapping, generate a generic city name based on state
          const stateDefaults: { [key: string]: string } = {
            "FL": "Orlando",
            "NY": "New York", 
            "CA": "Los Angeles",
            "TX": "Houston",
            "IL": "Chicago",
            "PA": "Philadelphia",
            "OH": "Columbus",
            "GA": "Atlanta",
            "NC": "Charlotte",
            "MI": "Detroit"
          };
          
          const defaultCity = stateDefaults[shippingAddress.state || ""] || "Unknown City";
          console.log(`No ZIP mapping found for ${normalizedCity}, using state default: "${defaultCity}"`);
          normalizedCity = defaultCity;
        }
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
        consigneeCity: normalizedCity,
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
          '收件人城市【.*】不能为纯数字': 'City field cannot be pure numbers. The system has detected this issue and it should be fixed automatically.',
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
      console.log("✅ Jiayou succeeded - proceeding with ShipStation update");

      // Get label URL immediately after order creation
      let labelPath = jiayouResponse.data.labelPath;
      if (!labelPath) {
        console.log(`No label path in initial response, requesting label for tracking ${jiayouResponse.data.trackingNo}`);
        try {
          const labelResponse = await jiayouService.printLabel([jiayouResponse.data.trackingNo]);
          if (labelResponse && labelResponse.code === 1 && labelResponse.data && labelResponse.data.length > 0) {
            labelPath = labelResponse.data[0].labelPath;
            console.log(`Got label path: ${labelPath}`);
          } else {
            console.error("Failed to get label from Jiayou immediately after order creation:", labelResponse);
          }
        } catch (labelError) {
          console.error("Error requesting label immediately after order creation:", labelError);
        }
      }

      // Update order with shipment data and mark as shipped
      const shipmentUpdate = {
        jiayouOrderId: jiayouResponse.data.orderId,
        trackingNumber: jiayouResponse.data.trackingNo,
        markNo: jiayouResponse.data.markNo,
        labelPath: labelPath || jiayouResponse.data.labelPath,
        channelCode: defaultChannelCode || "US001",
        serviceType: "standard",
        weight: weight?.toString() || "8",
        dimensions: dimensions || null,
        shippingCost: coverageCheck.data[0].totalFee.toString(),
        status: "shipped",
      };

      const updatedOrder = await storage.updateOrder(order.id, shipmentUpdate);

      // Update ShipStation with tracking info and label data
      if (order.shipstationOrderId) {
        const updateResult = await shipStationService.markAsShipped(
          parseInt(order.shipstationOrderId),
          jiayouResponse.data.trackingNo,
          labelPath
        );
        
        if (updateResult) {
          console.log(`Successfully created ShipStation shipment for order ${order.shipstationOrderId}`);
          console.log(`Tracking: ${jiayouResponse.data.trackingNo}, Label: ${labelPath}`);
        } else {
          console.error(`Failed to create ShipStation shipment for order ${order.shipstationOrderId}`);
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

  // Batch print labels for e-commerce operations
  app.post("/api/labels/batch-print", async (req, res) => {
    try {
      const { trackingNumbers } = req.body;
      
      if (!Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
        return res.status(400).json({ error: "trackingNumbers must be a non-empty array" });
      }

      console.log(`Batch printing ${trackingNumbers.length} labels:`, trackingNumbers);

      // Get label data from Jiayou
      const labelData = await jiayouService.printLabel(trackingNumbers);
      
      if (labelData && labelData.code === 1 && labelData.data) {
        // Update orders with label paths if they don't have them
        const orders = await storage.getAllOrders();
        for (const labelInfo of labelData.data) {
          const order = orders.find(o => o.trackingNumber === labelInfo.orderNumber);
          if (order && !order.labelPath && labelInfo.labelPath) {
            await storage.updateOrder(order.id, { labelPath: labelInfo.labelPath });
            console.log(`Updated order ${order.id} with label path: ${labelInfo.labelPath}`);
          }
        }

        res.json({
          success: true,
          count: labelData.data.length,
          labels: labelData.data,
          message: `Successfully prepared ${labelData.data.length} labels for batch printing`
        });
      } else {
        res.status(400).json({ 
          error: "Failed to retrieve labels from Jiayou",
          details: labelData 
        });
      }
    } catch (error) {
      console.error("Error batch printing labels:", error);
      res.status(500).json({ error: "Failed to batch print labels" });
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
