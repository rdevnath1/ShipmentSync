import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, index, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced multi-user system with roles and tenancy
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-friendly identifier
  logo: text("logo"), // Logo URL
  settings: jsonb("settings").default({}), // Organization-specific settings
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: text("role").notNull().default("client"), // master, client, viewer
  organizationId: integer("organization_id").references(() => organizations.id),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  shipstationOrderId: text("shipstation_order_id"),
  orderNumber: text("order_number").notNull(),
  referenceNumber: text("reference_number"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  shippingAddress: jsonb("shipping_address").notNull(),
  billingAddress: jsonb("billing_address"),
  items: jsonb("items").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  status: text("status").notNull().default("pending"), // pending, shipped, delivered, cancelled
  // Shipment fields (populated when shipped)
  jiayouOrderId: text("jiayou_order_id"),
  trackingNumber: text("tracking_number"),
  markNo: text("mark_no"),
  labelPath: text("label_path"),
  channelCode: text("channel_code"),
  serviceType: text("service_type"),
  weight: decimal("weight", { precision: 8, scale: 3 }),
  dimensions: jsonb("dimensions"),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  deliveredAt: timestamp("delivered_at"), // Track actual delivery timestamp
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_orders_organization").on(table.organizationId),
  index("idx_orders_status").on(table.status),
  index("idx_orders_created").on(table.createdAt),
  index("idx_orders_shipstation_id").on(table.shipstationOrderId),
  index("idx_orders_tracking_number").on(table.trackingNumber),
  index("idx_orders_jiayou_id").on(table.jiayouOrderId),
  index("idx_orders_org_status").on(table.organizationId, table.status),
  index("idx_orders_org_created").on(table.organizationId, table.createdAt),
]);

// Removed shipments table - shipment data is now part of orders table

export const trackingEvents = pgTable("tracking_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  event: text("event").notNull(),
  description: text("description"),
  location: text("location"),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics tables for comprehensive reporting
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  date: timestamp("date").notNull(),
  metric: text("metric").notNull(), // total_orders, shipped_orders, revenue, etc.
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  metadata: jsonb("metadata").default({}), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_analytics_org_date").on(table.organizationId, table.date),
  index("idx_analytics_metric").on(table.metric),
]);

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => [
  index("IDX_session_expire").on(table.expire),
]);

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Company/Client name
  keyId: text("key_id").notNull().unique(), // Public identifier
  keySecret: text("key_secret").notNull(), // Secret key for authentication
  permissions: jsonb("permissions").notNull(), // Array of permissions like ["read:orders", "write:shipments"]
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit log for API requests and system events
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // create_shipment, track_package, batch_print, etc.
  resource: text("resource"), // shipstation, jiayou, internal
  resourceId: text("resource_id"), // tracking number, order ID, etc.
  method: text("method"), // GET, POST, PUT, DELETE
  endpoint: text("endpoint"), // API endpoint called
  requestData: jsonb("request_data"), // Request payload (sanitized)
  responseData: jsonb("response_data"), // Response data (sanitized)
  statusCode: integer("status_code"), // HTTP status code
  success: boolean("success").notNull(),
  error: text("error"), // Error message if failed
  duration: integer("duration"), // Request duration in ms
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_logs_org").on(table.organizationId),
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_created").on(table.createdAt),
]);

// Retry queue for failed operations
export const retryQueue = pgTable("retry_queue", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  jobType: text("job_type").notNull(), // create_shipment, track_update, etc.
  payload: jsonb("payload").notNull(), // Job data
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  nextAttempt: timestamp("next_attempt").notNull(),
  lastError: text("last_error"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_retry_queue_next").on(table.nextAttempt),
  index("idx_retry_queue_status").on(table.status),
]);

// Raw API response logging for debugging
export const carrierLogs = pgTable("carrier_logs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  carrierName: text("carrier_name").notNull(), // jiayou, shipstation, etc.
  operation: text("operation").notNull(), // create_shipment, track_package, etc.
  requestPayload: jsonb("request_payload"),
  responsePayload: jsonb("response_payload"),
  statusCode: integer("status_code"),
  success: boolean("success").notNull(),
  error: text("error"),
  duration: integer("duration"), // ms
  resourceId: text("resource_id"), // tracking number, order ID, etc.
  endpoint: text("endpoint"), // API endpoint called
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_carrier_logs_org").on(table.organizationId),
  index("idx_carrier_logs_carrier").on(table.carrierName),
  index("idx_carrier_logs_operation").on(table.operation),
  index("idx_carrier_logs_created").on(table.createdAt),
  index("idx_carrier_logs_success").on(table.success),
]);

// Enhanced tracking events with standardized statuses
export const enhancedTrackingEvents = pgTable("enhanced_tracking_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  trackingNumber: text("tracking_number").notNull(),
  standardStatus: text("standard_status").notNull(), // StandardTrackingStatus enum
  rawStatus: text("raw_status"), // Original carrier status code
  description: text("description").notNull(),
  location: text("location"),
  carrierName: text("carrier_name").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  carrierSpecific: jsonb("carrier_specific"), // Carrier-specific data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_enhanced_tracking_order").on(table.orderId),
  index("idx_enhanced_tracking_number").on(table.trackingNumber),
  index("idx_enhanced_tracking_status").on(table.standardStatus),
  index("idx_enhanced_tracking_timestamp").on(table.timestamp),
]);

// Carrier accounts table - updated for modern APIs
export const carrierAccounts = pgTable("carrier_accounts", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  carrier: varchar("carrier", { length: 50 }).notNull(), // 'fedex', 'usps', 'ups', etc.
  
  // FedEx fields
  accountNumber: varchar("account_number", { length: 255 }),
  clientId: varchar("client_id", { length: 255 }),
  clientSecret: varchar("client_secret", { length: 255 }),
  
  // USPS fields  
  userId: varchar("user_id", { length: 255 }),
  
  // UPS fields (for future)
  key: varchar("key", { length: 255 }),
  password: varchar("password", { length: 255 }),
  
  // Common fields
  apiUrl: varchar("api_url", { length: 500 }),
  enabled: boolean("enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_carrier_accounts_org").on(table.organizationId),
  index("idx_carrier_accounts_carrier").on(table.carrier),
]);

// Wallet system tables
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }).unique().notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wallets_org").on(table.organizationId),
]);

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => wallets.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  type: varchar("type", { length: 50 }).notNull(), // 'credit', 'debit'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }),
  referenceId: varchar("reference_id", { length: 100 }), // shipment ID or payment reference
  addedBy: integer("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wallet_transactions_wallet").on(table.walletId),
  index("idx_wallet_transactions_org").on(table.organizationId),
  index("idx_wallet_transactions_type").on(table.type),
  index("idx_wallet_transactions_created").on(table.createdAt),
]);

// Define all relations
export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  users: many(users),
  orders: many(orders),
  analytics: many(analytics),
  carrierAccounts: many(carrierAccounts),
  wallet: one(wallets),
  walletTransactions: many(walletTransactions),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  trackingEvents: many(trackingEvents),
  organization: one(organizations, {
    fields: [orders.organizationId],
    references: [organizations.id],
  }),
}));

export const trackingEventsRelations = relations(trackingEvents, ({ one }) => ({
  order: one(orders, {
    fields: [trackingEvents.orderId],
    references: [orders.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  organization: one(organizations, {
    fields: [analytics.organizationId],
    references: [organizations.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ many }) => ({
  // Add relations if needed
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const retryQueueRelations = relations(retryQueue, ({ one }) => ({
  organization: one(organizations, {
    fields: [retryQueue.organizationId],
    references: [organizations.id],
  }),
}));

export const carrierLogsRelations = relations(carrierLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [carrierLogs.organizationId],
    references: [organizations.id],
  }),
}));

export const enhancedTrackingEventsRelations = relations(enhancedTrackingEvents, ({ one }) => ({
  order: one(orders, {
    fields: [enhancedTrackingEvents.orderId],
    references: [orders.id],
  }),
}));

export const carrierAccountsRelations = relations(carrierAccounts, ({ one }) => ({
  organization: one(organizations, {
    fields: [carrierAccounts.organizationId],
    references: [organizations.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [wallets.organizationId],
    references: [organizations.id],
  }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletTransactions.walletId],
    references: [wallets.id],
  }),
  organization: one(organizations, {
    fields: [walletTransactions.organizationId],
    references: [organizations.id],
  }),
  addedByUser: one(users, {
    fields: [walletTransactions.addedBy],
    references: [users.id],
  }),
}));

// Export types for TypeScript
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type InsertTrackingEvent = typeof trackingEvents.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type RetryQueueItem = typeof retryQueue.$inferSelect;
export type InsertRetryQueueItem = typeof retryQueue.$inferInsert;
export type CarrierLog = typeof carrierLogs.$inferSelect;
export type InsertCarrierLog = typeof carrierLogs.$inferInsert;
export type EnhancedTrackingEvent = typeof enhancedTrackingEvents.$inferSelect;
export type InsertEnhancedTrackingEvent = typeof enhancedTrackingEvents.$inferInsert;
export type CarrierAccount = typeof carrierAccounts.$inferSelect;
export type InsertCarrierAccount = typeof carrierAccounts.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

// Zod schemas for validation
export const insertOrganizationSchema = createInsertSchema(organizations);
export const insertUserSchema = createInsertSchema(users);
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrackingEventSchema = createInsertSchema(trackingEvents);
export const insertAnalyticsSchema = createInsertSchema(analytics);
export const insertApiKeySchema = createInsertSchema(apiKeys);
export const insertAuditLogSchema = createInsertSchema(auditLogs);
export const insertRetryQueueItemSchema = createInsertSchema(retryQueue);
export const insertCarrierLogSchema = createInsertSchema(carrierLogs);
export const insertEnhancedTrackingEventSchema = createInsertSchema(enhancedTrackingEvents);
export const insertCarrierAccountSchema = createInsertSchema(carrierAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
