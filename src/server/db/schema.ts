import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const propertyTypeEnum = pgEnum("property_type", [
  "house",
  "flat",
  "bungalow",
  "maisonette",
  "terraced",
  "semi_detached",
  "detached",
  "other",
]);

export const ownershipTypeEnum = pgEnum("ownership_type", [
  "owner_occupier",
  "tenant",
  "landlord",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "upcoming",
  "overdue",
  "completed",
  "skipped",
]);

export const taskFrequencyEnum = pgEnum("task_frequency", [
  "once",
  "weekly",
  "monthly",
  "quarterly",
  "biannually",
  "annually",
]);

export const documentCategoryEnum = pgEnum("document_category", [
  "certificate",
  "warranty",
  "receipt",
  "insurance",
  "manual",
  "report",
  "other",
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  fullName: text("full_name"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.userId),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  county: text("county"),
  postcode: varchar("postcode", { length: 10 }).notNull(),
  propertyType: propertyTypeEnum("property_type").notNull(),
  ownershipType: ownershipTypeEnum("ownership_type").notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  yearBuilt: integer("year_built"),
  localAuthority: text("local_authority"),
  epcRating: varchar("epc_rating", { length: 1 }),
  epcData: jsonb("epc_data"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  floor: integer("floor").default(0),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const appliances = pgTable("appliances", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  brand: text("brand"),
  model: text("model"),
  serialNumber: text("serial_number"),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }),
  warrantyExpiry: timestamp("warranty_expiry", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  applianceId: uuid("appliance_id").references(() => appliances.id, { onDelete: "set null" }),
  category: documentCategoryEnum("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").default("pending").notNull(),
  frequency: taskFrequencyEnum("frequency").default("once").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  isSystemGenerated: boolean("is_system_generated").default(false),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  properties: many(properties),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [properties.userId],
    references: [profiles.userId],
  }),
  rooms: many(rooms),
  appliances: many(appliances),
  documents: many(documents),
  maintenanceTasks: many(maintenanceTasks),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  property: one(properties, {
    fields: [rooms.propertyId],
    references: [properties.id],
  }),
  appliances: many(appliances),
}));

export const appliancesRelations = relations(appliances, ({ one, many }) => ({
  property: one(properties, {
    fields: [appliances.propertyId],
    references: [properties.id],
  }),
  room: one(rooms, {
    fields: [appliances.roomId],
    references: [rooms.id],
  }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  property: one(properties, {
    fields: [documents.propertyId],
    references: [properties.id],
  }),
  appliance: one(appliances, {
    fields: [documents.applianceId],
    references: [appliances.id],
  }),
}));

export const maintenanceTasksRelations = relations(maintenanceTasks, ({ one }) => ({
  property: one(properties, {
    fields: [maintenanceTasks.propertyId],
    references: [properties.id],
  }),
}));
