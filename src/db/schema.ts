import { pgTable, serial, text, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Bakery Domain Tables ────────────────────────────────────────────────────

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const outlets = pgTable("outlets", {
  id: serial("id").primaryKey(),
  brand_id: integer("brand_id").references(() => brands.id),
  name: text("name").notNull(),
  contact_info: text("contact_info"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  base_price: integer("base_price").default(0).notNull(),
  image_url: text("image_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  outlet_id: integer("outlet_id")
    .references(() => outlets.id)
    .notNull(),
  status: text("status").default("pending").notNull(),
  payment_status: text("payment_status"),        // 'paid', 'pending', 'failed'
  payment_method: text("payment_method"),        // 'cash', 'qris', 'transfer'
  discount_type: text("discount_type"),          // 'percentage', 'fixed'
  discount_amount: integer("discount_amount").default(0),
  subtotal: integer("subtotal"),                 // before discount
  total_amount: integer("total_amount"),          // final after discount
  notes: text("notes"),
  order_date: timestamp("order_date").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  product_id: integer("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unit_price: integer("unit_price"),             // snapshot of price at time of order
});

// Records every status transition — replaces the 4 timestamp columns
export const orderStatusLogs = pgTable("order_status_logs", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  from_status: text("from_status"),              // null = initial creation
  to_status: text("to_status").notNull(),
  changed_by: text("changed_by"),                // user id
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ─── Stock Management Tables ───────────────────────────────────────────────────

export const stock = pgTable("stock", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id")
    .references(() => products.id)
    .notNull(),
  outlet_id: integer("outlet_id").references(() => outlets.id), // NULL = central warehouse
  quantity: integer("quantity").default(0).notNull(),
  min_stock: integer("min_stock").default(5),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const stockTransactions = pgTable("stock_transactions", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id")
    .references(() => products.id)
    .notNull(),
  outlet_id: integer("outlet_id").references(() => outlets.id), // NULL = central warehouse
  transaction_type: text("transaction_type").notNull(), // 'add', 'deduct', 'transfer_out', 'transfer_in'
  quantity: integer("quantity").notNull(),
  reference_outlet_id: integer("reference_outlet_id").references(() => outlets.id),
  notes: text("notes"),
  created_by: text("created_by"),                // user id
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ─── Better Auth Tables ──────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("admin"),
  currentOutletId: integer("current_outlet_id").references(() => outlets.id),
  // Location tracking for runner role
  last_lat: real("last_lat"),
  last_lng: real("last_lng"),
  last_seen_at: timestamp("last_seen_at"),
  banned: boolean("banned"),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const brandsRelations = relations(brands, ({ many }) => ({
  outlets: many(outlets),
}));

export const outletsRelations = relations(outlets, ({ many, one }) => ({
  brand: one(brands, {
    fields: [outlets.brand_id],
    references: [brands.id],
  }),
  orders: many(orders),
  stock: many(stock),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  stock: many(stock),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  outlet: one(outlets, {
    fields: [orders.outlet_id],
    references: [outlets.id],
  }),
  items: many(orderItems),
  statusLogs: many(orderStatusLogs),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.order_id],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.product_id],
    references: [products.id],
  }),
}));

export const orderStatusLogsRelations = relations(orderStatusLogs, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusLogs.order_id],
    references: [orders.id],
  }),
}));

export const userRelations = relations(user, ({ one }) => ({
  currentOutlet: one(outlets, {
    fields: [user.currentOutletId],
    references: [outlets.id],
  }),
}));

export const stockRelations = relations(stock, ({ one }) => ({
  product: one(products, {
    fields: [stock.product_id],
    references: [products.id],
  }),
  outlet: one(outlets, {
    fields: [stock.outlet_id],
    references: [outlets.id],
  }),
}));

export const stockTransactionsRelations = relations(stockTransactions, ({ one }) => ({
  product: one(products, {
    fields: [stockTransactions.product_id],
    references: [products.id],
  }),
  outlet: one(outlets, {
    fields: [stockTransactions.outlet_id],
    references: [outlets.id],
  }),
  referenceOutlet: one(outlets, {
    fields: [stockTransactions.reference_outlet_id],
    references: [outlets.id],
  }),
}));
