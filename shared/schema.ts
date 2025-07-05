import { pgTable, text, serial, integer, boolean, numeric, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  code_barre: text("code_barre").notNull().unique(),
  num_inventaire: text("num_inventaire").notNull().unique(),
  old_num_inventaire: text("old_num_inventaire"),
  departement: text("departement").notNull(),
  num_bureau: text("num_bureau").notNull(),
  beneficiaire: text("beneficiaire").notNull(),
  designation: text("designation").notNull(),
  quantite: integer("quantite").notNull().default(1),
  num_serie: text("num_serie"),
  condition: text("condition").notNull(),
  description: text("description"),
  prix: numeric("prix", { precision: 12, scale: 2 }).notNull(),
  categorie: text("categorie").notNull(),
  chemin_image: text("chemin_image"),
  custom_fields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
  date_ajouter: timestamp("date_ajouter").notNull().defaultNow(),
  date_modification: timestamp("date_modification").notNull().defaultNow(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  date_ajouter: true,
  date_modification: true,
});

export const selectInventoryItemSchema = createSelectSchema(inventoryItems);

export const updateInventoryItemSchema = insertInventoryItemSchema.partial();

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type UpdateInventoryItem = z.infer<typeof updateInventoryItemSchema>;

// Search filters schema
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  fullTextSearch: z.string().optional(),
  code_barre: z.object({
    operator: z.enum(['equals', 'contains', 'startsWith']).default('contains'),
    value: z.string().optional(),
  }).optional(),
  departement: z.string().optional(),
  categorie: z.string().optional(),
  condition: z.string().optional(),
  prix_min: z.number().optional(),
  prix_max: z.number().optional(),
  date_ajouter: z.string().optional(),
  beneficiaire: z.string().optional(),
  num_bureau: z.string().optional(),
  num_inventaire: z.string().optional(),
  num_serie: z.string().optional(),
  description: z.string().optional(),
  designation: z.string().optional(),
  available_only: z.boolean().optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Search results table for storing barcode searches
export const searchResults = pgTable("search_results", {
  id: serial("id").primaryKey(),
  code_barre: text("code_barre").notNull(),
  date_recherche: timestamp("date_recherche").notNull().defaultNow(),
  found: boolean("found").notNull().default(false),
  scan_count: integer("scan_count").notNull().default(1),
  designation: text("designation"),
  last_scan_date: timestamp("last_scan_date").notNull().defaultNow(),
});

export const insertSearchResultSchema = createInsertSchema(searchResults).omit({
  id: true,
  date_recherche: true,
  last_scan_date: true,
});

export type InsertSearchResult = z.infer<typeof insertSearchResultSchema>;
export type SearchResult = typeof searchResults.$inferSelect;

// Deleted items table for undo/restore functionality
export const deletedItems = pgTable("deleted_items", {
  id: serial("id").primaryKey(),
  original_id: integer("original_id").notNull(),
  code_barre: text("code_barre").notNull(),
  num_inventaire: text("num_inventaire").notNull(),
  old_num_inventaire: text("old_num_inventaire"),
  departement: text("departement").notNull(),
  num_bureau: text("num_bureau").notNull(),
  beneficiaire: text("beneficiaire").notNull(),
  designation: text("designation").notNull(),
  quantite: integer("quantite").notNull().default(1),
  num_serie: text("num_serie"),
  condition: text("condition").notNull(),
  description: text("description"),
  prix: numeric("prix", { precision: 12, scale: 2 }).notNull(),
  categorie: text("categorie").notNull(),
  chemin_image: text("chemin_image"),
  date_ajouter: timestamp("date_ajouter").notNull(),
  date_modification: timestamp("date_modification").notNull(),
  date_suppression: timestamp("date_suppression").notNull().defaultNow(),
});

export const selectDeletedItemSchema = createSelectSchema(deletedItems);
export type DeletedItem = typeof deletedItems.$inferSelect;

// Audit Trail Schema
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'IMPORT', 'EXPORT'
  tableName: text("table_name").notNull(),
  recordId: integer("record_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  description: text("description"),
});

export const selectAuditLogSchema = createSelectSchema(auditLog);
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;
