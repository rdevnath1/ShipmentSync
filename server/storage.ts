import { 
  organizations, users, orders, trackingEvents, analytics, apiKeys, auditLogs, retryQueue, carrierLogs, enhancedTrackingEvents,
  type Organization, type InsertOrganization, type User, type InsertUser, 
  type Order, type InsertOrder, type TrackingEvent, type InsertTrackingEvent, 
  type Analytics, type InsertAnalytics, type ApiKey, type InsertApiKey,
  type AuditLog, type InsertAuditLog, type RetryQueueItem, type InsertRetryQueueItem,
  type CarrierLog, type InsertCarrierLog, type EnhancedTrackingEvent, type InsertEnhancedTrackingEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // Organization methods
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getAllOrganizations(): Promise<Organization[]>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailWithOrg(email: string): Promise<(User & { organization?: Organization }) | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;
  
  // Order methods (now includes shipment functionality)
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByOrganization(orgId: number): Promise<Order[]>;
  getOrderByShipstationId(shipstationOrderId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  getAllOrders(): Promise<Order[]>;
  getPendingOrders(): Promise<Order[]>;
  getShippedOrders(): Promise<Order[]>;
  getOrdersWithStats(orgId?: number): Promise<{ orders: Order[], pendingCount: number, shippedCount: number }>;
  deleteOrder(id: number): Promise<void>;
  
  // Analytics methods
  getAnalytics(orgId: number, startDate?: Date, endDate?: Date): Promise<Analytics[]>;
  createAnalyticsRecord(analytics: InsertAnalytics): Promise<Analytics>;
  
  // Tracking methods
  createTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent>;
  getTrackingEventsByOrderId(orderId: number): Promise<TrackingEvent[]>;
  
  // API Key methods
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKey(keyId: string): Promise<ApiKey | undefined>;
  getApiKeys(): Promise<ApiKey[]>;
  updateApiKey(id: number, apiKey: Partial<InsertApiKey>): Promise<ApiKey>;
  deleteApiKey(id: number): Promise<void>;
  updateApiKeyLastUsed(keyId: string): Promise<void>;
  
  // Audit Log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(orgId?: number, limit?: number): Promise<AuditLog[]>;
  
  // Retry Queue methods
  createRetryQueueItem(item: InsertRetryQueueItem): Promise<RetryQueueItem>;
  getRetryQueueItem(id: number): Promise<RetryQueueItem | undefined>;
  updateRetryQueueItem(id: number, item: Partial<InsertRetryQueueItem>): Promise<RetryQueueItem>;
  getPendingRetryJobs(limit?: number): Promise<RetryQueueItem[]>;
  
  // Carrier Log methods
  createCarrierLog(log: InsertCarrierLog): Promise<CarrierLog>;
  getCarrierLogs(carrierName?: string, limit?: number): Promise<CarrierLog[]>;
  
  // Enhanced Tracking methods
  createEnhancedTrackingEvent(event: InsertEnhancedTrackingEvent): Promise<EnhancedTrackingEvent>;
  getEnhancedTrackingEvents(trackingNumber: string): Promise<EnhancedTrackingEvent[]>;
}

export class DatabaseStorage implements IStorage {
  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return org || undefined;
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(insertOrg).returning();
    return org;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByEmailWithOrg(email: string): Promise<(User & { organization?: Organization }) | undefined> {
    const result = await db.select()
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(eq(users.email, email));
    
    if (!result.length) return undefined;
    
    const row = result[0];
    return {
      ...row.users,
      organization: row.organizations || undefined
    };
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByOrganization(orgId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.organizationId, orgId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrderByShipstationId(shipstationOrderId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.shipstationOrderId, shipstationOrderId));
    return order || undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values({
        ...insertOrder,
        updatedAt: new Date(),
      })
      .returning();
    return order;
  }

  async updateOrder(id: number, orderUpdate: Partial<InsertOrder>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({
        ...orderUpdate,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  // Optimized: Get orders with status counts in single query (with org filtering)
  async getOrdersWithStats(orgId?: number): Promise<{ orders: Order[], pendingCount: number, shippedCount: number }> {
    const baseQuery = orgId ? 
      db.select().from(orders).where(eq(orders.organizationId, orgId)) :
      db.select().from(orders);
    
    const statsQuery = orgId ?
      db.select({ 
        status: orders.status, 
        count: sql<number>`count(*)::int`
      }).from(orders).where(eq(orders.organizationId, orgId)).groupBy(orders.status) :
      db.select({ 
        status: orders.status, 
        count: sql<number>`count(*)::int`
      }).from(orders).groupBy(orders.status);

    const [ordersResult, stats] = await Promise.all([
      baseQuery.orderBy(desc(orders.createdAt)),
      statsQuery
    ]);
    
    const statusMap = stats.reduce((acc, row) => {
      acc[row.status] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      orders: ordersResult,
      pendingCount: statusMap.pending || 0,
      shippedCount: statusMap.shipped || 0
    };
  }

  // Analytics methods
  async getAnalytics(orgId: number, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    const conditions = [eq(analytics.organizationId, orgId)];
    
    if (startDate) {
      conditions.push(gte(analytics.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(analytics.date, endDate));
    }
    
    return await db.select().from(analytics)
      .where(and(...conditions))
      .orderBy(desc(analytics.date));
  }

  async createAnalyticsRecord(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const [record] = await db.insert(analytics).values(insertAnalytics).returning();
    return record;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getPendingOrders(): Promise<Order[]> {
    return await db.query.orders.findMany({
      where: eq(orders.status, 'pending'),
      with: {
        trackingEvents: true,
      },
      orderBy: desc(orders.createdAt),
    });
  }

  async getShippedOrders(): Promise<Order[]> {
    return await db.query.orders.findMany({
      where: eq(orders.status, 'shipped'),
      with: {
        trackingEvents: true,
      },
      orderBy: desc(orders.createdAt),
    });
  }

  async createTrackingEvent(insertEvent: InsertTrackingEvent): Promise<TrackingEvent> {
    const [event] = await db
      .insert(trackingEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getTrackingEventsByOrderId(orderId: number): Promise<TrackingEvent[]> {
    return await db.select().from(trackingEvents).where(eq(trackingEvents.orderId, orderId)).orderBy(desc(trackingEvents.timestamp));
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const [apiKey] = await db
      .insert(apiKeys)
      .values(insertApiKey)
      .returning();
    return apiKey;
  }

  async getApiKey(keyId: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyId, keyId));
    return apiKey || undefined;
  }

  async getApiKeys(): Promise<ApiKey[]> {
    const keys = await db
      .select()
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt));
    return keys;
  }

  async updateApiKey(id: number, apiKeyUpdate: Partial<InsertApiKey>): Promise<ApiKey> {
    const [apiKey] = await db
      .update(apiKeys)
      .set({ ...apiKeyUpdate, updatedAt: new Date() })
      .where(eq(apiKeys.id, id))
      .returning();
    return apiKey;
  }

  async deleteApiKey(id: number): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async updateApiKeyLastUsed(keyId: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.keyId, keyId));
  }

  // Audit Log methods
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    try {
      const [log] = await db
        .insert(auditLogs)
        .values(insertLog)
        .returning();
      return log;
    } catch (error) {
      // Gracefully handle audit log creation failures - return minimal log object
      console.warn("Failed to create audit log:", error);
      return {
        id: 0,
        organizationId: insertLog.organizationId || null,
        userId: insertLog.userId || null,
        action: insertLog.action,
        resource: insertLog.resource || null,
        resourceId: insertLog.resourceId || null,
        method: insertLog.method || null,
        endpoint: insertLog.endpoint || null,
        requestData: insertLog.requestData || null,
        responseData: insertLog.responseData || null,
        ipAddress: insertLog.ipAddress || null,
        userAgent: insertLog.userAgent || null,
        statusCode: insertLog.statusCode || null,
        success: insertLog.success,
        error: insertLog.error || null,
        duration: insertLog.duration || null,
        createdAt: new Date()
      };
    }
  }

  async getAuditLogs(orgId?: number, limit: number = 100): Promise<AuditLog[]> {
    const query = db.select().from(auditLogs);
    
    if (orgId) {
      return await query
        .where(eq(auditLogs.organizationId, orgId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
    }
    
    return await query
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  // Retry Queue methods
  async createRetryQueueItem(insertItem: InsertRetryQueueItem): Promise<RetryQueueItem> {
    const [item] = await db
      .insert(retryQueue)
      .values(insertItem)
      .returning();
    return item;
  }

  async getRetryQueueItem(id: number): Promise<RetryQueueItem | undefined> {
    const [item] = await db
      .select()
      .from(retryQueue)
      .where(eq(retryQueue.id, id));
    return item || undefined;
  }

  async updateRetryQueueItem(id: number, itemUpdate: Partial<InsertRetryQueueItem>): Promise<RetryQueueItem> {
    const [item] = await db
      .update(retryQueue)
      .set({ ...itemUpdate, updatedAt: new Date() })
      .where(eq(retryQueue.id, id))
      .returning();
    return item;
  }

  async getPendingRetryJobs(limit: number = 50): Promise<RetryQueueItem[]> {
    return await db
      .select()
      .from(retryQueue)
      .where(eq(retryQueue.status, 'pending'))
      .orderBy(retryQueue.nextAttempt)
      .limit(limit);
  }

  // Carrier Log methods
  async createCarrierLog(insertLog: InsertCarrierLog): Promise<CarrierLog> {
    const [log] = await db
      .insert(carrierLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getCarrierLogs(carrierName?: string, limit: number = 100): Promise<CarrierLog[]> {
    const query = db.select().from(carrierLogs);
    
    if (carrierName) {
      return await query
        .where(eq(carrierLogs.carrierName, carrierName))
        .orderBy(desc(carrierLogs.createdAt))
        .limit(limit);
    }
    
    return await query
      .orderBy(desc(carrierLogs.createdAt))
      .limit(limit);
  }

  // Enhanced Tracking methods
  async createEnhancedTrackingEvent(insertEvent: InsertEnhancedTrackingEvent): Promise<EnhancedTrackingEvent> {
    const [event] = await db
      .insert(enhancedTrackingEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getEnhancedTrackingEvents(trackingNumber: string): Promise<EnhancedTrackingEvent[]> {
    return await db
      .select()
      .from(enhancedTrackingEvents)
      .where(eq(enhancedTrackingEvents.trackingNumber, trackingNumber))
      .orderBy(desc(enhancedTrackingEvents.timestamp));
  }
}

export const storage = new DatabaseStorage();
