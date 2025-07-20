import express from "express";
import { requireAuth, requireOrgAccess } from "../auth";
import { createAuditMiddleware } from "../middleware/audit-middleware";
import { JiayouService } from "../services/jiayou";

const router = express.Router();

// Rate preview endpoint - returns cost and ETA before creating shipment
router.post("/preview", requireAuth, requireOrgAccess, createAuditMiddleware('rate_preview', 'rates'), async (req, res) => {
  try {
    const { 
      pickupZipCode,
      deliveryZipCode,
      weight, 
      dimensions, 
      serviceType = 'standard',
      channelCode = 'US001' 
    } = req.body;

    // Validate required fields
    if (!pickupZipCode || !deliveryZipCode || !weight || !dimensions) {
      return res.status(400).json({
        error: "Missing required fields: pickupZipCode, deliveryZipCode, weight, dimensions"
      });
    }

    // Validate ZIP code formats
    if (!/^\d{5}$/.test(pickupZipCode)) {
      return res.status(400).json({
        error: "Invalid pickup ZIP code format - must be 5 digits"
      });
    }

    if (!/^\d{5}$/.test(deliveryZipCode)) {
      return res.status(400).json({
        error: "Invalid delivery ZIP code format - must be 5 digits"
      });
    }

    // Calculate estimated cost based on weight, dimensions, and ZIP codes
    const estimatedCost = calculateShippingCost(weight, dimensions, 'US', pickupZipCode, deliveryZipCode);
    
    // Get shipping zone based on ZIP codes
    const shippingZone = getShippingZone('US', pickupZipCode, deliveryZipCode);
    
    // Calculate estimated delivery time based on zone
    const estimatedDelivery = calculateDeliveryTime(shippingZone, serviceType);

    // Get service options
    const serviceOptions = getAvailableServices('US');

    const responseData = {
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
          serviceArea: 'Domestic US',
          restrictions: []
        },
        rateCalculation: {
          baseWeight: weight,
          dimensions: dimensions,
          zone: shippingZone,
          factors: {
            weightFactor: Math.ceil(weight / 0.45), // Per pound
            dimensionalWeight: calculateDimensionalWeight(dimensions),
            zoneFactor: getZoneMultiplier(shippingZone)
          }
        }
      },
      warnings: [],
      validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      request: {
        pickupZipCode,
        deliveryZipCode,
        weight,
        dimensions
      }
    };
    
    res.json(responseData);

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
function calculateShippingCost(weight: number, dimensions: any, country: string, originZip?: string, destZip?: string): number {
  const zone = getShippingZone(country, originZip, destZip);
  const dimensionalWeight = calculateDimensionalWeight(dimensions);
  
  // Only use dimensional weight if it's significantly larger than actual weight AND the package is very light
  // This prevents small packages from being overcharged due to packaging dimensions
  let billableWeight = weight;
  if (weight < 1.0 && dimensionalWeight > weight * 3) {
    billableWeight = Math.min(dimensionalWeight, weight * 2); // Cap dimensional weight impact for small packages
  } else {
    billableWeight = Math.max(weight, dimensionalWeight);
  }
  
  // Get base rate from weight tiers (based on your rate chart)
  let baseRate = 0;
  if (billableWeight <= 0.5) {
    baseRate = 3.89;
  } else if (billableWeight <= 1.0) {
    baseRate = 4.20;
  } else if (billableWeight <= 1.5) {
    baseRate = 4.68;
  } else if (billableWeight <= 2.0) {
    baseRate = 5.04; // This should be the rate for 1.5-2kg range
  } else if (billableWeight <= 3.0) {
    baseRate = 5.85;
  } else if (billableWeight <= 5.0) {
    baseRate = 7.56;
  } else {
    // For weights over 5kg, calculate progressively
    baseRate = 7.56 + ((billableWeight - 5) * 1.5);
  }
  
  const zoneMultiplier = getZoneMultiplier(zone);
  const cost = baseRate * zoneMultiplier;
  
  return Math.round(cost * 100) / 100; // Round to 2 decimal places
}

function calculateDimensionalWeight(dimensions: any): number {
  const { length, width, height } = dimensions;
  // Standard dimensional weight formula: L × W × H / 5000 (for cm to kg)
  // Only apply dimensional weight if package is large and light
  const dimWeight = (length * width * height) / 5000;
  return dimWeight;
}

function getShippingZone(country: string, originZip?: string, destZip?: string): string {
  if (country !== 'US') {
    if (country === 'CA') return 'Zone 2';
    if (['MX', 'PR', 'VI', 'GU'].includes(country)) return 'Zone 3';
    return 'Zone 4'; // International
  }

  // For US domestic shipping, calculate zone based on ZIP code distance
  if (!originZip || !destZip) return 'Zone 1';

  const originDigits = parseInt(originZip.substring(0, 3));
  const destDigits = parseInt(destZip.substring(0, 3));
  
  // Calculate approximate distance using ZIP code ranges
  const distance = calculateZipDistance(originDigits, destDigits);
  
  // Map distance to shipping zones (similar to USPS zones)
  if (distance <= 150) return 'Zone 1'; // Local
  if (distance <= 300) return 'Zone 2'; // Regional
  if (distance <= 600) return 'Zone 3'; // 
  if (distance <= 1000) return 'Zone 4';
  if (distance <= 1400) return 'Zone 5';
  if (distance <= 1800) return 'Zone 6';
  if (distance <= 2200) return 'Zone 7';
  return 'Zone 8'; // Cross-country
}

function calculateZipDistance(origin3Digit: number, dest3Digit: number): number {
  // Simplified distance calculation based on first 3 digits of ZIP codes
  // This maps ZIP prefixes to approximate geographic locations
  
  const zipRegions = {
    // Northeast
    010: { lat: 42.36, lon: -71.06 }, // Boston area
    121: { lat: 42.75, lon: -73.80 }, // Albany, NY (12134 is in this region)
    100: { lat: 40.71, lon: -74.01 }, // NYC area
    
    // Southeast  
    300: { lat: 33.75, lon: -84.39 }, // Atlanta
    321: { lat: 28.54, lon: -81.38 }, // Orlando
    
    // Midwest
    600: { lat: 41.88, lon: -87.63 }, // Chicago
    550: { lat: 44.98, lon: -93.27 }, // Minneapolis
    
    // Southwest
    750: { lat: 32.78, lon: -96.80 }, // Dallas
    853: { lat: 33.45, lon: -112.07 }, // Phoenix
    
    // West Coast
    900: { lat: 34.05, lon: -118.24 }, // Los Angeles
    941: { lat: 37.77, lon: -122.42 }, // San Francisco
    981: { lat: 47.61, lon: -122.33 }, // Seattle (98174 is in this region)
  };

  // Get coordinates for origin and destination regions
  const originCoords = zipRegions[origin3Digit] || zipRegions[Math.floor(origin3Digit / 10) * 10] || zipRegions[100];
  const destCoords = zipRegions[dest3Digit] || zipRegions[Math.floor(dest3Digit / 10) * 10] || zipRegions[900];

  // Calculate approximate distance using Haversine formula
  const R = 3959; // Earth's radius in miles
  const dLat = (destCoords.lat - originCoords.lat) * Math.PI / 180;
  const dLon = (destCoords.lon - originCoords.lon) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(originCoords.lat * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in miles
}

function getZoneMultiplier(zone: string): number {
  switch (zone) {
    case 'Zone 1': return 1.0;
    case 'Zone 2': return 1.3;
    case 'Zone 3': return 1.6;
    case 'Zone 4': return 2.0;
    case 'Zone 5': return 2.4;
    case 'Zone 6': return 2.8;
    case 'Zone 7': return 3.2;
    case 'Zone 8': return 3.8;
    default: return 1.0;
  }
}

function calculateDeliveryTime(zone: string, serviceType: string): any {
  let baseDays = 3;
  
  switch (zone) {
    case 'Zone 1': baseDays = 3; break;
    case 'Zone 2': baseDays = 4; break;
    case 'Zone 3': baseDays = 5; break;
    case 'Zone 4': baseDays = 6; break;
    case 'Zone 5': baseDays = 7; break;
    case 'Zone 6': baseDays = 8; break;
    case 'Zone 7': baseDays = 9; break;
    case 'Zone 8': baseDays = 10; break;
    default: baseDays = 3; break;
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