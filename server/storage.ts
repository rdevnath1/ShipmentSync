import { 
  organizations, users, orders, trackingEvents, analytics, apiKeys, auditLogs, retryQueue, carrierLogs, enhancedTrackingEvents, carrierAccounts, wallets, walletTransactions,
  type Organization, type InsertOrganization, type User, type InsertUser, 
  type Order, type InsertOrder, type TrackingEvent, type InsertTrackingEvent, 
  type Analytics, type InsertAnalytics, type ApiKey, type InsertApiKey,
  type AuditLog, type InsertAuditLog, type RetryQueueItem, type InsertRetryQueueItem,
  type CarrierLog, type InsertCarrierLog, type EnhancedTrackingEvent, type InsertEnhancedTrackingEvent,
  type CarrierAccount, type InsertCarrierAccount, type Wallet, type InsertWallet,
  type WalletTransaction, type InsertWalletTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // Organization methods
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, org: Partial<InsertOrganization>): Promise<Organization>;
  deleteOrganization(id: number): Promise<void>;
  getAllOrganizations(): Promise<any[]>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailWithOrg(email: string): Promise<(User & { organization?: Organization }) | undefined>;
  getUsersByOrganization(orgId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;
  getUsers(): Promise<User[]>;
  
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
  
  // Carrier Account methods
  getCarrierAccounts(organizationId: number): Promise<CarrierAccount[]>;
  getCarrierAccount(id: number): Promise<CarrierAccount | undefined>;
  createCarrierAccount(data: InsertCarrierAccount): Promise<CarrierAccount>;
  updateCarrierAccount(id: number, data: Partial<InsertCarrierAccount>): Promise<CarrierAccount | undefined>;
  deleteCarrierAccount(id: number): Promise<void>;
  getActiveCarrierAccount(organizationId: number, carrier: string): Promise<CarrierAccount | undefined>;

  // Wallet methods
  getWallet(organizationId: number): Promise<Wallet | undefined>;
  createWallet(organizationId: number): Promise<Wallet>;
  getWalletBalance(organizationId: number): Promise<number>;
  addCredit(organizationId: number, amount: number, description: string, addedBy: number, referenceId?: string): Promise<WalletTransaction>;
  deductAmount(organizationId: number, amount: number, description: string, referenceId?: string): Promise<WalletTransaction>;
  getWalletTransactions(organizationId: number, limit?: number): Promise<WalletTransaction[]>;
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

  async updateOrganization(id: number, orgUpdate: Partial<InsertOrganization>): Promise<Organization> {
    const [org] = await db
      .update(organizations)
      .set(orgUpdate)
      .where(eq(organizations.id, id))
      .returning();
    return org;
  }

  async deleteOrganization(id: number): Promise<void> {
    // Delete related data first (cascade delete)
    await db.delete(users).where(eq(users.organizationId, id));
    await db.delete(orders).where(eq(orders.organizationId, id));
    await db.delete(analytics).where(eq(analytics.organizationId, id));
    await db.delete(auditLogs).where(eq(auditLogs.organizationId, id));
    await db.delete(retryQueue).where(eq(retryQueue.organizationId, id));
    
    // Finally delete the organization
    await db.delete(organizations).where(eq(organizations.id, id));
  }

  async getAllOrganizations(): Promise<any[]> {
    // Get organizations with user and order counts
    const orgsWithStats = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        settings: organizations.settings,
        isActive: organizations.isActive,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        userCount: count(users.id),
        orderCount: count(orders.id)
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.id, users.organizationId))
      .leftJoin(orders, eq(organizations.id, orders.organizationId))
      .groupBy(organizations.id)
      .orderBy(desc(organizations.createdAt));

    return orgsWithStats;
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

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByOrganization(orgId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.organizationId, orgId))
      .orderBy(desc(users.createdAt));
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
        organizationId: insertOrder.organizationId || 1, // Default to organization 1 if not specified
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
    try {
      let query = db.select().from(orders);
      
      if (orgId) {
        query = query.where(eq(orders.organizationId, orgId));
      }
      
      const allOrders = await query.orderBy(desc(orders.createdAt));
      
      // Calculate stats efficiently
      const pendingCount = allOrders.filter(order => order.status === 'pending').length;
      const shippedCount = allOrders.filter(order => order.status === 'shipped').length;
      
      return {
        orders: allOrders,
        pendingCount,
        shippedCount
      };
    } catch (error) {
      console.error('Error fetching orders with stats:', error);
      throw error;
    }
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

  // Carrier Account methods
  async getCarrierAccounts(organizationId: number): Promise<CarrierAccount[]> {
    return await db
      .select()
      .from(carrierAccounts)
      .where(eq(carrierAccounts.organizationId, organizationId))
      .orderBy(desc(carrierAccounts.createdAt));
  }

  async getCarrierAccount(id: number): Promise<CarrierAccount | undefined> {
    const [account] = await db
      .select()
      .from(carrierAccounts)
      .where(eq(carrierAccounts.id, id));
    return account || undefined;
  }

  async createCarrierAccount(insertData: InsertCarrierAccount): Promise<CarrierAccount> {
    const [account] = await db
      .insert(carrierAccounts)
      .values(insertData)
      .returning();
    return account;
  }

  async updateCarrierAccount(id: number, updateData: Partial<InsertCarrierAccount>): Promise<CarrierAccount | undefined> {
    const [account] = await db
      .update(carrierAccounts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(carrierAccounts.id, id))
      .returning();
    return account || undefined;
  }

  async deleteCarrierAccount(id: number): Promise<void> {
    await db.delete(carrierAccounts).where(eq(carrierAccounts.id, id));
  }

  async getActiveCarrierAccount(organizationId: number, carrier: string): Promise<CarrierAccount | undefined> {
    const [account] = await db
      .select()
      .from(carrierAccounts)
      .where(
        and(
          eq(carrierAccounts.organizationId, organizationId),
          eq(carrierAccounts.carrier, carrier),
          eq(carrierAccounts.enabled, true)
        )
      );
    return account || undefined;
  }

  // Wallet methods
  async getWallet(organizationId: number): Promise<Wallet | undefined> {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.organizationId, organizationId));
    return wallet || undefined;
  }

  async createWallet(organizationId: number): Promise<Wallet> {
    const [wallet] = await db
      .insert(wallets)
      .values({ organizationId })
      .returning();
    return wallet;
  }

  async getWalletBalance(organizationId: number): Promise<number> {
    const wallet = await this.getWallet(organizationId);
    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await this.createWallet(organizationId);
      return parseFloat(newWallet.balance);
    }
    return parseFloat(wallet.balance);
  }

  async addCredit(
    organizationId: number, 
    amount: number, 
    description: string, 
    addedBy: number, 
    referenceId?: string
  ): Promise<WalletTransaction> {
    // Use database transaction to prevent race conditions
    return await db.transaction(async (tx) => {
      // Get or create wallet with row lock
      let [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.organizationId, organizationId))
        .for('update');

      if (!wallet) {
        // Create wallet if it doesn't exist
        [wallet] = await tx
          .insert(wallets)
          .values({
            organizationId,
            balance: '0.00'
          })
          .returning();
      }

      const currentBalance = parseFloat(wallet.balance);
      const newBalance = currentBalance + amount;

      // Update wallet balance
      await tx
        .update(wallets)
        .set({ 
          balance: newBalance.toFixed(2),
          lastUpdated: new Date()
        })
        .where(eq(wallets.id, wallet.id));

      // Create transaction record
      const [transaction] = await tx
        .insert(walletTransactions)
        .values({
          walletId: wallet.id,
          organizationId,
          type: 'credit',
          amount: amount.toFixed(2),
          balanceBefore: currentBalance.toFixed(2),
          balanceAfter: newBalance.toFixed(2),
          description,
          referenceId,
          addedBy
        })
        .returning();

      return transaction;
    });
  }

  async deductAmount(
    organizationId: number, 
    amount: number, 
    description: string, 
    referenceId?: string
  ): Promise<WalletTransaction> {
    // Use database transaction to prevent race conditions
    return await db.transaction(async (tx) => {
      // Get wallet with row lock to prevent concurrent modifications
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.organizationId, organizationId))
        .for('update');

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const currentBalance = parseFloat(wallet.balance);
      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }

      const newBalance = currentBalance - amount;

      // Update wallet balance
      await tx
        .update(wallets)
        .set({ 
          balance: newBalance.toFixed(2),
          lastUpdated: new Date()
        })
        .where(eq(wallets.id, wallet.id));

      // Create transaction record
      const [transaction] = await tx
        .insert(walletTransactions)
        .values({
          walletId: wallet.id,
          organizationId,
          type: 'debit',
          amount: amount.toFixed(2),
          balanceBefore: currentBalance.toFixed(2),
          balanceAfter: newBalance.toFixed(2),
          description,
          referenceId
        })
        .returning();

      return transaction;
    });
  }

  async getWalletTransactions(organizationId: number, limit: number = 50): Promise<WalletTransaction[]> {
    const transactions = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.organizationId, organizationId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);
    
    return transactions;
  }
}

export const storage = new DatabaseStorage();
