import { 
  organizations, users, orders, trackingEvents, analytics, apiKeys, auditLogs, retryQueue, carrierLogs, enhancedTrackingEvents, carrierAccounts, wallets, walletTransactions, rateComparisons,
  type Organization, type InsertOrganization, type User, type InsertUser, 
  type Order, type InsertOrder, type TrackingEvent, type InsertTrackingEvent, 
  type Analytics, type InsertAnalytics, type ApiKey, type InsertApiKey,
  type AuditLog, type InsertAuditLog, type RetryQueueItem, type InsertRetryQueueItem,
  type CarrierLog, type InsertCarrierLog, type EnhancedTrackingEvent, type InsertEnhancedTrackingEvent,
  type CarrierAccount, type InsertCarrierAccount, type Wallet, type InsertWallet,
  type WalletTransaction, type InsertWalletTransaction, type RateComparison, type InsertRateComparison
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

  // Rate Comparison methods
  createRateComparison(comparison: InsertRateComparison): Promise<RateComparison>;
  getRateComparisons(organizationId: number, startDate?: Date, endDate?: Date): Promise<RateComparison[]>;
  getRateComparisonStats(organizationId: number): Promise<{
    totalSavings: number;
    quikpikWinRate: number;
    totalComparisons: number;
  }>;
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

  // Rate Comparison methods
  async createRateComparison(comparison: InsertRateComparison): Promise<RateComparison> {
    const [rateComparison] = await db
      .insert(rateComparisons)
      .values(comparison)
      .returning();
    return rateComparison;
  }

  async getRateComparisons(organizationId: number, startDate?: Date, endDate?: Date): Promise<RateComparison[]> {
    let query = db
      .select()
      .from(rateComparisons)
      .where(eq(rateComparisons.organizationId, organizationId));

    if (startDate && endDate) {
      query = db
        .select()
        .from(rateComparisons)
        .where(
          and(
            eq(rateComparisons.organizationId, organizationId),
            gte(rateComparisons.timestamp, startDate),
            lte(rateComparisons.timestamp, endDate)
          )
        );
    }

    const comparisons = await query.orderBy(desc(rateComparisons.timestamp));
    return comparisons;
  }

  async getRateComparisonStats(organizationId: number): Promise<{
    totalSavings: number;
    quikpikWinRate: number;
    totalComparisons: number;
  }> {
    const comparisons = await db
      .select()
      .from(rateComparisons)
      .where(eq(rateComparisons.organizationId, organizationId));

    const totalSavings = comparisons.reduce((sum, comp) => sum + parseFloat(comp.savings), 0);
    const quikpikWins = comparisons.filter(comp => comp.winningCarrier === 'quikpik').length;
    const quikpikWinRate = comparisons.length > 0 ? (quikpikWins / comparisons.length) * 100 : 0;

    return {
      totalSavings,
      quikpikWinRate,
      totalComparisons: comparisons.length
    };
  }
}

// Mock storage for development mode when database is not available
export class MockStorage implements IStorage {
  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    return {
      id: 1,
      name: 'Demo Organization',
      slug: 'demo',
      settings: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    return slug === 'demo' ? await this.getOrganization(1) : undefined;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    return {
      id: 1,
      name: org.name,
      slug: org.slug,
      settings: org.settings || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async updateOrganization(id: number, org: Partial<InsertOrganization>): Promise<Organization> {
    return await this.getOrganization(id) as Organization;
  }

  async deleteOrganization(id: number): Promise<void> {
    // Mock delete
  }

  async getAllOrganizations(): Promise<any[]> {
    return [await this.getOrganization(1)];
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return {
      id: id,
      email: id === 1 ? 'rajan@quikpik.io' : 'demo@client.com',
      firstName: id === 1 ? 'Master' : 'Demo',
      lastName: id === 1 ? 'Admin' : 'User',
      password: 'hashed_password',
      role: id === 1 ? 'master' : 'client',
      isActive: true,
      organizationId: id === 1 ? null : 1,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (email === 'rajan@quikpik.io') return await this.getUser(1);
    if (email === 'demo@client.com') return await this.getUser(2);
    return undefined;
  }

  async getUserByEmailWithOrg(email: string): Promise<(User & { organization?: Organization }) | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    
    return {
      ...user,
      organization: user.organizationId ? await this.getOrganization(user.organizationId) : undefined
    };
  }

  async getUsersByOrganization(orgId: number): Promise<User[]> {
    return [await this.getUser(2) as User];
  }

  async createUser(user: InsertUser): Promise<User> {
    return {
      id: Date.now(),
      ...user,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async updateUserLastLogin(id: number): Promise<void> {
    // Mock update
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    // Mock update
  }

  async getUsers(): Promise<User[]> {
    return [await this.getUser(1) as User, await this.getUser(2) as User];
  }

  // Order methods - return mock orders for development mode
  async getOrder(id: number): Promise<Order | undefined> {
    console.log('MockStorage.getOrder called with id:', id);
    const mockOrders = await this.getOrdersWithStats(1); // Pass orgId 1 for mock data
    console.log('Mock orders available:', mockOrders.orders.map(o => o.id));
    const found = mockOrders.orders.find(order => order.id === id);
    console.log('Found order:', found ? `ID ${found.id}` : 'not found');
    return found;
  }

  async getOrdersByOrganization(orgId: number): Promise<Order[]> {
    return [];
  }

  async getOrderByShipstationId(shipstationOrderId: string): Promise<Order | undefined> {
    return undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    return {
      id: Date.now(),
      ...order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    return await this.createOrder(order as InsertOrder);
  }

  async getAllOrders(): Promise<Order[]> {
    return [];
  }

  async getPendingOrders(): Promise<Order[]> {
    return [];
  }

  async getShippedOrders(): Promise<Order[]> {
    return [];
  }

  async getOrdersWithStats(orgId?: number): Promise<{ orders: Order[], pendingCount: number, shippedCount: number }> {
    // Return some mock orders for demonstration
    const mockOrders: Order[] = [
      {
        id: 1001,
        shipstationOrderId: "12345",
        orderNumber: "SS-001",
        referenceNumber: "REF-001",
        customerName: "John Doe",
        customerEmail: "john.doe@example.com",
        customerPhone: "555-123-4567",
        shippingAddress: {
          name: "John Doe",
          company: "",
          street1: "123 Main St",
          street2: "",
          city: "New York",
          state: "NY",
          postalCode: "10001",
          country: "US",
          phone: "555-123-4567"
        },
        billingAddress: {
          name: "John Doe",
          company: "",
          street1: "123 Main St",
          street2: "",
          city: "New York",
          state: "NY",
          postalCode: "10001",
          country: "US",
          phone: "555-123-4567"
        },
        items: [
          {
            orderItemId: 1,
            lineItemKey: "item-1",
            sku: "WIDGET-001",
            name: "Sample Widget",
            quantity: 2,
            unitPrice: 25.00,
            weight: { value: 1, units: "pounds" }
          }
        ],
        totalAmount: "50.00",
        currency: "USD",
        status: "pending",
        organizationId: orgId || 1,
        trackingNumber: null,
        labelPath: null,
        jiayouOrderId: null,
        markNo: null,
        channelCode: null,
        serviceType: null,
        weight: null,
        dimensions: null,
        shippingCost: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 1002,
        shipstationOrderId: "12346",
        orderNumber: "SS-002",
        referenceNumber: "REF-002",
        customerName: "Jane Smith",
        customerEmail: "jane.smith@example.com",
        customerPhone: "555-987-6543",
        shippingAddress: {
          name: "Jane Smith",
          company: "Acme Corp",
          street1: "456 Oak Ave",
          street2: "Suite 200",
          city: "Los Angeles",
          state: "CA",
          postalCode: "90210",
          country: "US",
          phone: "555-987-6543"
        },
        billingAddress: {
          name: "Jane Smith",
          company: "Acme Corp",
          street1: "456 Oak Ave",
          street2: "Suite 200",
          city: "Los Angeles",
          state: "CA",
          postalCode: "90210",
          country: "US",
          phone: "555-987-6543"
        },
        items: [
          {
            orderItemId: 2,
            lineItemKey: "item-2",
            sku: "GADGET-002",
            name: "Premium Gadget",
            quantity: 1,
            unitPrice: 99.99,
            weight: { value: 2, units: "pounds" }
          }
        ],
        totalAmount: "99.99",
        currency: "USD",
        status: "shipped",
        organizationId: orgId || 1,
        trackingNumber: "QP25USA0U020270941",
        labelPath: "https://example.com/label1.pdf",
        jiayouOrderId: "GV25USA0U020270941",
        markNo: "MK001",
        channelCode: "US001",
        serviceType: "standard",
        weight: "2.0",
        dimensions: "10x8x4",
        shippingCost: "12.50",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
      },
      {
        id: 1003,
        shipstationOrderId: "12347",
        orderNumber: "SS-003",
        referenceNumber: "REF-003",
        customerName: "Bob Wilson",
        customerEmail: "bob.wilson@example.com",
        customerPhone: "555-456-7890",
        shippingAddress: {
          name: "Bob Wilson",
          company: "Tech Solutions",
          street1: "789 Tech Blvd",
          street2: "Floor 3",
          city: "Austin",
          state: "TX",
          postalCode: "73301",
          country: "US",
          phone: "555-456-7890"
        },
        billingAddress: {
          name: "Bob Wilson",
          company: "Tech Solutions",
          street1: "789 Tech Blvd",
          street2: "Floor 3",
          city: "Austin",
          state: "TX",
          postalCode: "73301",
          country: "US",
          phone: "555-456-7890"
        },
        items: [
          {
            orderItemId: 3,
            lineItemKey: "item-3",
            sku: "TECH-003",
            name: "Advanced Module",
            quantity: 3,
            unitPrice: 75.00,
            weight: { value: 0.5, units: "pounds" }
          }
        ],
        totalAmount: "225.00",
        currency: "USD",
        status: "shipped",
        organizationId: orgId || 1,
        trackingNumber: "QP25USA0U020270942",
        labelPath: "https://example.com/label2.pdf",
        jiayouOrderId: "GV25USA0U020270942",
        markNo: "MK002",
        channelCode: "US001",
        serviceType: "standard",
        weight: "1.5",
        dimensions: "8x6x3",
        shippingCost: "8.75",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      }
    ];

    const pendingOrders = mockOrders.filter(order => order.status === 'pending');
    const shippedOrders = mockOrders.filter(order => order.status === 'shipped');

    return {
      orders: mockOrders,
      pendingCount: pendingOrders.length,
      shippedCount: shippedOrders.length
    };
  }

  async deleteOrder(id: number): Promise<void> {
    // Mock delete
  }

  // Analytics methods
  async getAnalytics(orgId: number, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    return [];
  }

  async createAnalyticsRecord(analytics: InsertAnalytics): Promise<Analytics> {
    return {
      id: Date.now(),
      ...analytics,
      createdAt: new Date().toISOString()
    };
  }

  // Tracking methods
  async createTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent> {
    return {
      id: Date.now(),
      ...event,
      createdAt: new Date().toISOString()
    };
  }

  async getTrackingEvents(trackingNumber: string): Promise<TrackingEvent[]> {
    return [];
  }

  async getLastTrackingEvent(trackingNumber: string): Promise<TrackingEvent | undefined> {
    return undefined;
  }

  async createEnhancedTrackingEvent(event: InsertEnhancedTrackingEvent): Promise<EnhancedTrackingEvent> {
    return {
      id: Date.now(),
      ...event,
      createdAt: new Date().toISOString()
    };
  }

  async getEnhancedTrackingEvents(trackingNumber: string): Promise<EnhancedTrackingEvent[]> {
    return [];
  }

  // API Key methods
  async getApiKeys(): Promise<ApiKey[]> {
    return [];
  }

  async getApiKey(keyId: string): Promise<ApiKey | undefined> {
    return undefined;
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    return {
      id: Date.now(),
      ...apiKey,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async updateApiKey(id: number, updates: Partial<InsertApiKey>): Promise<ApiKey> {
    return await this.createApiKey(updates as InsertApiKey);
  }

  async deleteApiKey(id: number): Promise<void> {
    // Mock delete
  }

  async updateApiKeyLastUsed(keyId: string): Promise<void> {
    // Mock update
  }

  // Audit Log methods - CRITICAL: These must exist for audit middleware
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    console.log('Mock audit log:', log.action, log.endpoint);
    return {
      id: Date.now(),
      ...log,
      createdAt: new Date().toISOString()
    };
  }

  async getAuditLogs(orgId?: number, limit?: number): Promise<AuditLog[]> {
    return [];
  }

  // Retry Queue methods
  async createRetryQueueItem(item: InsertRetryQueueItem): Promise<RetryQueueItem> {
    return {
      id: Date.now(),
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async getRetryQueueItem(id: number): Promise<RetryQueueItem | undefined> {
    return undefined;
  }

  async updateRetryQueueItem(id: number, item: Partial<InsertRetryQueueItem>): Promise<RetryQueueItem> {
    return await this.createRetryQueueItem(item as InsertRetryQueueItem);
  }

  async getPendingRetryJobs(limit?: number): Promise<RetryQueueItem[]> {
    return [];
  }

  // Carrier Log methods
  async createCarrierLog(log: InsertCarrierLog): Promise<CarrierLog> {
    return {
      id: Date.now(),
      ...log,
      createdAt: new Date().toISOString()
    };
  }

  async getCarrierLogs(orgId?: number, limit?: number): Promise<CarrierLog[]> {
    return [];
  }

  // Carrier Account methods
  async getCarrierAccounts(organizationId: number): Promise<CarrierAccount[]> {
    return [];
  }

  async createCarrierAccount(account: InsertCarrierAccount): Promise<CarrierAccount> {
    return {
      id: Date.now(),
      ...account,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async updateCarrierAccount(id: number, account: Partial<InsertCarrierAccount>): Promise<CarrierAccount> {
    return await this.createCarrierAccount(account as InsertCarrierAccount);
  }

  async deleteCarrierAccount(id: number): Promise<void> {
    // Mock delete
  }

  // Wallet methods
  async getWalletBalance(organizationId: number): Promise<number> {
    return 1000.00; // Mock balance
  }

  async getWallet(organizationId: number): Promise<Wallet | undefined> {
    return {
      id: 1,
      organizationId,
      balance: 1000.00,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async getOrCreateWallet(organizationId: number): Promise<Wallet> {
    return {
      id: 1,
      organizationId,
      balance: 1000.00,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async deductAmount(organizationId: number, amount: number, description: string, referenceId?: string): Promise<WalletTransaction> {
    return {
      id: Date.now(),
      organizationId,
      amount: -amount,
      type: 'debit',
      description,
      referenceId: referenceId || null,
      balanceAfter: 1000.00 - amount,
      createdAt: new Date().toISOString()
    };
  }

  async addAmount(organizationId: number, amount: number, description: string, referenceId?: string): Promise<WalletTransaction> {
    return {
      id: Date.now(),
      organizationId,
      amount,
      type: 'credit',
      description,
      referenceId: referenceId || null,
      balanceAfter: 1000.00 + amount,
      createdAt: new Date().toISOString()
    };
  }

  async getWalletTransactions(organizationId: number, limit: number = 50): Promise<WalletTransaction[]> {
    return [];
  }

  // Rate Comparison methods - Mock implementations
  async createRateComparison(comparison: InsertRateComparison): Promise<RateComparison> {
    return {
      id: Date.now(),
      ...comparison,
      createdAt: new Date(),
      timestamp: new Date()
    };
  }

  async getRateComparisons(organizationId: number, startDate?: Date, endDate?: Date): Promise<RateComparison[]> {
    // Return mock rate comparison data
    const mockComparisons: RateComparison[] = [
      {
        id: 1,
        organizationId,
        orderId: 'ORD-001',
        quikpikCost: '8.50',
        competitorCosts: [
          { carrier: 'USPS', cost: 9.20, service: 'Ground Advantage' },
          { carrier: 'FedEx', cost: 12.45, service: 'Ground' }
        ],
        winningCarrier: 'quikpik',
        winningCost: '8.50',
        savings: '0.70',
        savingsPercentage: '7.61',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        organizationId,
        orderId: 'ORD-002',
        quikpikCost: '10.25',
        competitorCosts: [
          { carrier: 'USPS', cost: 7.80, service: 'Ground Advantage' },
          { carrier: 'FedEx', cost: 11.90, service: 'Ground' }
        ],
        winningCarrier: 'USPS',
        winningCost: '7.80',
        savings: '0.00',
        savingsPercentage: '0.00',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    ];

    return mockComparisons;
  }

  async getRateComparisonStats(organizationId: number): Promise<{
    totalSavings: number;
    quikpikWinRate: number;
    totalComparisons: number;
  }> {
    return {
      totalSavings: 45.50,
      quikpikWinRate: 75.0,
      totalComparisons: 12
    };
  }
}

// Export appropriate storage based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const hasDatabase = !!process.env.DATABASE_URL;
console.log(`Storage selection: NODE_ENV=${process.env.NODE_ENV}, DATABASE_URL=${hasDatabase ? 'set' : 'not set'}`);
console.log(`Using ${(isDevelopment && !hasDatabase) ? 'MockStorage' : 'DatabaseStorage'}`);

export const storage = (isDevelopment && !hasDatabase) 
  ? new MockStorage() 
  : new DatabaseStorage();
