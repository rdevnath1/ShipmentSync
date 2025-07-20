import express from "express";
import { requireAuth, requireOrgAccess } from "../auth";
import { createAuditMiddleware } from "../middleware/audit-middleware";
import { JiayouService } from "../services/jiayou";

const router = express.Router();

// Rate preview endpoint - returns cost and ETA before creating shipment
router.post("/preview", requireAuth, requireOrgAccess, createAuditMiddleware('rate_preview', 'rates'), async (req, res) => {
  try {
    const { 
      shippingAddress, 
      weight, 
      dimensions, 
      serviceType = 'standard',
      channelCode = 'US001' 
    } = req.body;

    // Validate required fields
    if (!shippingAddress || !weight || !dimensions) {
      return res.status(400).json({
        error: "Missing required fields: shippingAddress, weight, dimensions"
      });
    }

    // Basic address validation
    if (!shippingAddress.postalCode || !shippingAddress.country) {
      return res.status(400).json({
        error: "Address validation failed",
        details: ["Postal code and country are required"]
      });
    }

    // Simple coverage check for US addresses
    if (shippingAddress.country === 'US' && !/^\d{5}(-\d{4})?$/.test(shippingAddress.postalCode)) {
      return res.status(400).json({
        error: "Invalid US postal code format"
      });
    }

    // Calculate estimated cost based on weight and dimensions
    const estimatedCost = calculateShippingCost(weight, dimensions, shippingAddress.country);
    
    // Calculate estimated delivery time
    const estimatedDelivery = calculateDeliveryTime(shippingAddress.country, serviceType);

    // Get service options
    const serviceOptions = getAvailableServices(shippingAddress.country);

    res.json({
      success: true,
      preview: {
        estimatedCost: {
          amount: estimatedCost,
          currency: 'USD',
          formatted: `$${estimatedCost.toFixed(2)}`
        },
        estimatedDelivery: {
          businessDays: estimatedDelivery.days,
          description: estimatedDelivery.description,
          estimatedDate: estimatedDelivery.date
        },
        serviceOptions,
        coverage: {
          available: true,
          serviceArea: shippingAddress.country === 'US' ? 'Domestic US' : 'International',
          restrictions: []
        },
        rateCalculation: {
          baseWeight: weight,
          dimensions: dimensions,
          zone: getShippingZone(shippingAddress.country, shippingAddress.postalCode),
          factors: {
            weightFactor: Math.ceil(weight / 0.45), // Per pound
            dimensionalWeight: calculateDimensionalWeight(dimensions),
            zoneFactor: getZoneMultiplier(shippingAddress.country)
          }
        }
      },
      warnings: [],
      validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    });

  } catch (error) {
    console.error("Rate preview error:", error);
    
    res.status(500).json({
      error: "Failed to calculate rate preview",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available services for a destination
router.post("/services", requireAuth, requireOrgAccess, createAuditMiddleware('get_services', 'rates'), async (req, res) => {
  try {
    const { country, postalCode } = req.body;

    if (!country) {
      return res.status(400).json({ error: "Country is required" });
    }

    const services = getAvailableServices(country, postalCode);
    const zone = getShippingZone(country, postalCode);

    res.json({
      success: true,
      country,
      postalCode,
      zone,
      services,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error("Services lookup error:", error);
    res.status(500).json({ error: "Failed to get available services" });
  }
});

// Bulk rate preview for multiple destinations
router.post("/bulk-preview", requireAuth, requireOrgAccess, createAuditMiddleware('bulk_rate_preview', 'rates'), async (req, res) => {
  try {
    const { shipments } = req.body;

    if (!Array.isArray(shipments) || shipments.length === 0) {
      return res.status(400).json({ error: "shipments array is required" });
    }

    if (shipments.length > 20) {
      return res.status(400).json({ error: "Maximum 20 shipments allowed per bulk request" });
    }

    const results = [];
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      
      try {
        // Basic validation
        if (shipment.shippingAddress && shipment.shippingAddress.postalCode) {
          const estimatedCost = calculateShippingCost(
            shipment.weight, 
            shipment.dimensions, 
            shipment.shippingAddress.country
          );
          
          const estimatedDelivery = calculateDeliveryTime(
            shipment.shippingAddress.country, 
            shipment.serviceType || 'standard'
          );

          results.push({
            index: i,
            success: true,
            estimatedCost: {
              amount: estimatedCost,
              currency: 'USD',
              formatted: `$${estimatedCost.toFixed(2)}`
            },
            estimatedDelivery,
            warnings: []
          });
        } else {
          results.push({
            index: i,
            success: false,
            error: "Address validation failed",
            details: ["Invalid or incomplete address"]
          });
        }
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCost = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.estimatedCost?.amount || 0), 0);

    res.json({
      success: true,
      results,
      summary: {
        total: shipments.length,
        successful: successCount,
        failed: shipments.length - successCount,
        totalEstimatedCost: {
          amount: totalCost,
          currency: 'USD',
          formatted: `$${totalCost.toFixed(2)}`
        }
      }
    });

  } catch (error) {
    console.error("Bulk rate preview error:", error);
    res.status(500).json({ error: "Failed to process bulk rate preview" });
  }
});

// Helper functions for rate calculations
function calculateShippingCost(weight: number, dimensions: any, country: string): number {
  const baseRate = 3.89; // Base Jiayou rate
  const weightFactor = Math.max(weight, 0.05) * 2.5; // Per kg
  const dimensionalWeight = calculateDimensionalWeight(dimensions);
  const zoneMultiplier = getZoneMultiplier(country);
  
  const billableWeight = Math.max(weight, dimensionalWeight);
  const cost = (baseRate + (billableWeight * weightFactor)) * zoneMultiplier;
  
  return Math.round(cost * 100) / 100; // Round to 2 decimal places
}

function calculateDimensionalWeight(dimensions: any): number {
  const { length, width, height } = dimensions;
  // Standard dimensional weight formula: L × W × H / 5000 (for cm to kg)
  return (length * width * height) / 5000;
}

function getShippingZone(country: string, postalCode?: string): string {
  // Simplified zone mapping
  if (country === 'US') return 'Zone 1';
  if (country === 'CA') return 'Zone 2';
  if (['MX', 'PR', 'VI', 'GU'].includes(country)) return 'Zone 3';
  return 'Zone 4'; // International
}

function getZoneMultiplier(country: string): number {
  const zone = getShippingZone(country);
  switch (zone) {
    case 'Zone 1': return 1.0;
    case 'Zone 2': return 1.2;
    case 'Zone 3': return 1.5;
    case 'Zone 4': return 2.0;
    default: return 1.0;
  }
}

function calculateDeliveryTime(country: string, serviceType: string): any {
  const zone = getShippingZone(country);
  let baseDays = 3;
  
  switch (zone) {
    case 'Zone 1': baseDays = 3; break;
    case 'Zone 2': baseDays = 5; break;
    case 'Zone 3': baseDays = 7; break;
    case 'Zone 4': baseDays = 10; break;
  }

  if (serviceType === 'express') {
    baseDays = Math.max(1, baseDays - 2);
  }

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + baseDays);

  return {
    days: baseDays,
    description: `${baseDays}-${baseDays + 2} business days`,
    date: deliveryDate.toISOString().split('T')[0] // YYYY-MM-DD
  };
}

function getAvailableServices(country: string, postalCode?: string): any[] {
  const zone = getShippingZone(country, postalCode);
  
  const services = [
    {
      code: 'standard',
      name: 'Standard Shipping',
      description: 'Reliable delivery with tracking',
      available: true
    }
  ];

  // Express only available for closer zones
  if (['Zone 1', 'Zone 2'].includes(zone)) {
    services.push({
      code: 'express',
      name: 'Express Shipping',
      description: 'Faster delivery with priority handling',
      available: true
    });
  }

  return services;
}

export default router;