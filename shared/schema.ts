import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  shipstationOrderId: text("shipstation_order_id").unique(),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

export const ordersRelations = relations(orders, ({ many }) => ({
  trackingEvents: many(trackingEvents),
}));

export const trackingEventsRelations = relations(trackingEvents, ({ one }) => ({
  order: one(orders, {
    fields: [trackingEvents.orderId],
    references: [orders.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ many }) => ({
  // Future: add usage logs relation if needed
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Removed shipment schema - using order schema instead

export const insertTrackingEventSchema = createInsertSchema(trackingEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Removed shipment types - using order types instead

export type InsertTrackingEvent = z.infer<typeof insertTrackingEventSchema>;
export type TrackingEvent = typeof trackingEvents.$inferSelect;

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUsed: true,
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
