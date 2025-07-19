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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_orders_organization").on(table.organizationId),
  index("idx_orders_status").on(table.status),
  index("idx_orders_created").on(table.createdAt),
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

// Define all relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  orders: many(orders),
  analytics: many(analytics),
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

// Zod schemas for validation
export const insertOrganizationSchema = createInsertSchema(organizations);
export const insertUserSchema = createInsertSchema(users);
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrackingEventSchema = createInsertSchema(trackingEvents);
export const insertAnalyticsSchema = createInsertSchema(analytics);
export const insertApiKeySchema = createInsertSchema(apiKeys);
