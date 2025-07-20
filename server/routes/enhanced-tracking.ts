import express from "express";
import { storage } from "../storage";
import { StatusMapper, StandardTrackingStatus } from "../utils/status-mapper";
import { EnhancedJiayouService } from "../services/enhanced-jiayou";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

// Get enhanced tracking information for a tracking number
router.get("/:trackingNumber", async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    // Get enhanced tracking events from database
    const enhancedEvents = await storage.getEnhancedTrackingEvents(trackingNumber);

    // Get real-time tracking from carrier
    const jiayouService = new EnhancedJiayouService();
    const liveTracking = await jiayouService.trackShipment(trackingNumber);

    // Combine stored events with live data
    const events = enhancedEvents.map(event => ({
      id: event.id,
      status: event.standardStatus,
      description: event.description,
      location: event.location,
      timestamp: event.timestamp,
      displayInfo: StatusMapper.getStatusDisplayInfo(event.standardStatus as StandardTrackingStatus),
      source: 'stored'
    }));

    // Add live events if available
    if (liveTracking.success && liveTracking.data?.fromDetail) {
      const liveEvents = liveTracking.data.fromDetail.map((detail: any) => {
        const mappedEvent = StatusMapper.mapJiayouStatus(detail.pathCode, detail.pathInfo);
        return {
          status: mappedEvent.status,
          description: mappedEvent.description,
          location: detail.pathAddr || '',
          timestamp: new Date(detail.pathTime || Date.now()),
          displayInfo: StatusMapper.getStatusDisplayInfo(mappedEvent.status),
          source: 'live',
          raw: detail
        };
      });

      events.push(...liveEvents);
    }

    // Sort by timestamp (most recent first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Determine current status
    const currentStatus = events.length > 0 ? events[0].status : StandardTrackingStatus.LABEL_CREATED;
    const statusInfo = StatusMapper.getStatusDisplayInfo(currentStatus as StandardTrackingStatus);

    res.json({
      trackingNumber,
      currentStatus,
      statusInfo,
      isDelivered: StatusMapper.isDelivered(currentStatus as StandardTrackingStatus),
      isActive: StatusMapper.isActive(currentStatus as StandardTrackingStatus),
      isProblem: StatusMapper.isProblem(currentStatus as StandardTrackingStatus),
      isFinal: StatusMapper.isFinal(currentStatus as StandardTrackingStatus),
      events,
      lastUpdated: events.length > 0 ? events[0].timestamp : new Date(),
      eventCount: events.length
    });

  } catch (error) {
    console.error("Enhanced tracking error:", error);
    res.status(500).json({ 
      error: "Failed to fetch enhanced tracking information",
      trackingNumber: req.params.trackingNumber 
    });
  }
});

// Bulk tracking for multiple tracking numbers (authenticated only)
router.post("/bulk", requireAuth, async (req, res) => {
  try {
    const { trackingNumbers } = req.body;

    if (!Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
      return res.status(400).json({ error: "trackingNumbers array is required" });
    }

    if (trackingNumbers.length > 50) {
      return res.status(400).json({ error: "Maximum 50 tracking numbers allowed per request" });
    }

    const results = [];
    const jiayouService = new EnhancedJiayouService(req.user?.organizationId, req.user?.id);

    for (const trackingNumber of trackingNumbers) {
      try {
        // Get enhanced events for this tracking number
        const enhancedEvents = await storage.getEnhancedTrackingEvents(trackingNumber);
        const currentStatus = enhancedEvents.length > 0 ? 
          enhancedEvents[0].standardStatus as StandardTrackingStatus : 
          StandardTrackingStatus.LABEL_CREATED;

        const statusInfo = StatusMapper.getStatusDisplayInfo(currentStatus);

        results.push({
          trackingNumber,
          currentStatus,
          statusInfo,
          isDelivered: StatusMapper.isDelivered(currentStatus),
          isActive: StatusMapper.isActive(currentStatus),
          isProblem: StatusMapper.isProblem(currentStatus),
          eventCount: enhancedEvents.length,
          lastUpdated: enhancedEvents[0]?.timestamp || null
        });

      } catch (error) {
        results.push({
          trackingNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
          currentStatus: StandardTrackingStatus.EXCEPTION,
          statusInfo: StatusMapper.getStatusDisplayInfo(StandardTrackingStatus.EXCEPTION)
        });
      }
    }

    res.json({
      results,
      processed: results.length,
      requested: trackingNumbers.length
    });

  } catch (error) {
    console.error("Bulk tracking error:", error);
    res.status(500).json({ error: "Failed to process bulk tracking request" });
  }
});

// Force refresh tracking for a specific number (authenticated only)
router.post("/:trackingNumber/refresh", requireAuth, async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const jiayouService = new EnhancedJiayouService(req.user?.organizationId, req.user?.id);

    // Force fetch fresh data from carrier
    const trackingResult = await jiayouService.trackShipment(trackingNumber);

    if (!trackingResult.success) {
      return res.status(400).json({
        error: trackingResult.error?.message || 'Failed to refresh tracking data'
      });
    }

    // Get updated enhanced events
    const enhancedEvents = await storage.getEnhancedTrackingEvents(trackingNumber);

    res.json({
      message: "Tracking data refreshed successfully",
      trackingNumber,
      eventCount: enhancedEvents.length,
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error("Tracking refresh error:", error);
    res.status(500).json({ 
      error: "Failed to refresh tracking data",
      trackingNumber: req.params.trackingNumber 
    });
  }
});

export default router;