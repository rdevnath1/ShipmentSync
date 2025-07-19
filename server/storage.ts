import { users, orders, trackingEvents, apiKeys, type User, type InsertUser, type Order, type InsertOrder, type TrackingEvent, type InsertTrackingEvent, type ApiKey, type InsertApiKey } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Order methods (now includes shipment functionality)
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByShipstationId(shipstationOrderId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  getAllOrders(): Promise<Order[]>;
  getPendingOrders(): Promise<Order[]>;
  getShippedOrders(): Promise<Order[]>;
  getOrdersWithStats(): Promise<{ orders: Order[], pendingCount: number, shippedCount: number }>;
  deleteOrder(id: number): Promise<void>;
  
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
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

  // Optimized: Get orders with status counts in single query
  async getOrdersWithStats(): Promise<{ orders: Order[], pendingCount: number, shippedCount: number }> {
    const [orders, stats] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select({ 
        status: orders.status, 
        count: sql<number>`count(*)::int`
      }).from(orders).groupBy(orders.status)
    ]);
    
    const statusMap = stats.reduce((acc, row) => {
      acc[row.status] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      orders,
      pendingCount: statusMap.pending || 0,
      shippedCount: statusMap.shipped || 0
    };
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
}

export const storage = new DatabaseStorage();
