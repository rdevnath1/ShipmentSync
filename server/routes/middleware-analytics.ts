import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { z } from "zod";

// Query schema for analytics filters
const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  routedTo: z.enum(['quikpik', 'traditional']).optional(),
  minSaved: z.string().optional()
});

export function registerMiddlewareAnalyticsRoutes(app: Express) {
  // Get middleware analytics for an organization
  app.get('/api/middleware/analytics', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const organizationId = user.organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: "No organization found" });
      }

      // Parse query parameters
      const queryResult = analyticsQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: queryResult.error });
      }

      const filters = {
        startDate: queryResult.data.dateFrom ? new Date(queryResult.data.dateFrom) : 
                  queryResult.data.startDate ? new Date(queryResult.data.startDate) : undefined,
        endDate: queryResult.data.dateTo ? new Date(queryResult.data.dateTo) : 
                queryResult.data.endDate ? new Date(queryResult.data.endDate) : undefined,
        routedTo: queryResult.data.routedTo,
        minSaved: queryResult.data.minSaved ? parseFloat(queryResult.data.minSaved) : undefined
      };

      const analytics = await storage.getMiddlewareAnalytics(organizationId, filters);
      
      // Map the data to include all needed fields for frontend
      const enhancedAnalytics = analytics.map(record => ({
        id: record.id,
        orderId: record.orderId?.toString(),
        shipstationOrderId: record.shipstationOrderId,
        routedTo: record.routedTo,
        reason: record.decisionReason,
        saved: parseFloat(record.savedAmount || '0'),
        quikpikRate: parseFloat(record.quikpikRate || '0'),
        alternativeRate: parseFloat(record.alternativeCost || '0'),
        timestamp: record.createdAt,
        destinationZip: record.destinationZip,
        weight: record.weight ? parseFloat(record.weight) : undefined,
        fedexRate: record.fedexRate ? parseFloat(record.fedexRate) : undefined,
        uspsRate: record.uspsRate ? parseFloat(record.uspsRate) : undefined
      }));
      
      res.json(enhancedAnalytics);
    } catch (error) {
      console.error('Error fetching middleware analytics:', error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get middleware analytics summary
  app.get('/api/middleware/analytics/summary', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const organizationId = user.organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: "No organization found" });
      }

      // Parse query parameters
      const queryResult = analyticsQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: queryResult.error });
      }

      const startDate = queryResult.data.startDate ? new Date(queryResult.data.startDate) : undefined;
      const endDate = queryResult.data.endDate ? new Date(queryResult.data.endDate) : undefined;

      const summary = await storage.getMiddlewareSummary(organizationId, startDate, endDate);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching middleware summary:', error);
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });

  // Get recent routing decisions (for dashboard transparency)
  app.get('/api/middleware/analytics/recent', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const organizationId = user.organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: "No organization found" });
      }

      // Get last 10 routing decisions
      const analytics = await storage.getMiddlewareAnalytics(organizationId, {});
      const recentDecisions = analytics.slice(0, 10).map(decision => ({
        id: decision.id,
        orderId: decision.shipstationOrderId,
        routedTo: decision.routedTo,
        reason: decision.decisionReason,
        saved: parseFloat(decision.savedAmount || '0'),
        quikpikRate: parseFloat(decision.quikpikRate || '0'),
        alternativeRate: parseFloat(decision.alternativeCost || '0'),
        timestamp: decision.createdAt
      }));

      res.json(recentDecisions);
    } catch (error) {
      console.error('Error fetching recent decisions:', error);
      res.status(500).json({ error: "Failed to fetch recent decisions" });
    }
  });
}