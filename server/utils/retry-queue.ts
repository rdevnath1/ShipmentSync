import { storage } from "../storage";
import type { InsertRetryQueueItem } from "@shared/schema";
import { ErrorHandler } from "./error-handler";

export interface RetryJobPayload {
  [key: string]: any;
}

export interface RetryJob {
  type: string;
  payload: RetryJobPayload;
  organizationId?: number;
  maxAttempts?: number;
}

class RetryQueueManager {
  private processing = false;
  private processingInterval?: NodeJS.Timeout;

  async addJob(job: RetryJob): Promise<void> {
    const nextAttempt = new Date(Date.now() + ErrorHandler.getRetryDelay(0));
    
    const retryItem: InsertRetryQueueItem = {
      organizationId: job.organizationId || null,
      jobType: job.type,
      payload: job.payload,
      attempts: 0,
      maxAttempts: job.maxAttempts || 3,
      nextAttempt,
      status: "pending",
    };

    await storage.createRetryQueueItem(retryItem);
    this.startProcessing();
  }

  async processJob(jobId: number): Promise<boolean> {
    const job = await storage.getRetryQueueItem(jobId);
    if (!job || job.status !== "pending") {
      return false;
    }

    // Mark as processing
    await storage.updateRetryQueueItem(jobId, { 
      status: "processing",
      updatedAt: new Date(),
    });

    try {
      let success = false;
      
      switch (job.jobType) {
        case "create_shipment":
          success = await this.retryCreateShipment(job.payload);
          break;
        case "track_update":
          success = await this.retryTrackUpdate(job.payload);
          break;
        case "shipstation_sync":
          success = await this.retryShipStationSync(job.payload);
          break;
        default:
          console.warn(`Unknown job type: ${job.jobType}`);
          success = false;
      }

      if (success) {
        await storage.updateRetryQueueItem(jobId, { 
          status: "completed",
          updatedAt: new Date(),
        });
        return true;
      } else {
        throw new Error("Job execution returned false");
      }
    } catch (error) {
      const attempts = job.attempts + 1;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (attempts >= job.maxAttempts) {
        // Mark as failed
        await storage.updateRetryQueueItem(jobId, {
          status: "failed",
          attempts,
          lastError: errorMessage,
          updatedAt: new Date(),
        });
        console.error(`Job ${jobId} failed after ${attempts} attempts:`, errorMessage);
        return false;
      } else {
        // Schedule retry
        const nextAttempt = new Date(Date.now() + ErrorHandler.getRetryDelay(attempts));
        await storage.updateRetryQueueItem(jobId, {
          status: "pending",
          attempts,
          nextAttempt,
          lastError: errorMessage,
          updatedAt: new Date(),
        });
        console.log(`Job ${jobId} will retry in ${ErrorHandler.getRetryDelay(attempts)}ms (attempt ${attempts})`);
        return false;
      }
    }
  }

  private async retryCreateShipment(payload: any): Promise<boolean> {
    // Implementation would go here - retry shipment creation
    console.log("Retrying shipment creation:", payload);
    return false; // Placeholder
  }

  private async retryTrackUpdate(payload: any): Promise<boolean> {
    // Implementation would go here - retry tracking update
    console.log("Retrying tracking update:", payload);
    return false; // Placeholder
  }

  private async retryShipStationSync(payload: any): Promise<boolean> {
    // Implementation would go here - retry ShipStation sync
    console.log("Retrying ShipStation sync:", payload);
    return false; // Placeholder
  }

  startProcessing(): void {
    if (this.processing) return;
    
    this.processing = true;
    this.processingInterval = setInterval(async () => {
      try {
        await this.processNextJobs();
      } catch (error) {
        console.error("Error processing retry queue:", error);
      }
    }, 5000); // Check every 5 seconds
  }

  stopProcessing(): void {
    this.processing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  private async processNextJobs(): Promise<void> {
    const pendingJobs = await storage.getPendingRetryJobs(10); // Process up to 10 jobs
    
    for (const job of pendingJobs) {
      if (new Date() >= job.nextAttempt) {
        await this.processJob(job.id);
      }
    }
  }
}

export const retryQueue = new RetryQueueManager();