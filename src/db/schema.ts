import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Bakery Domain Tables ────────────────────────────────────────────────────

export const outlets = pgTable("outlets", {
  id: serial("id").primaryKey(),
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
  payment_status: text("payment_status"),
  payment_method: text("payment_method"), // 'cash', 'qris', 'transfer'
  discount_type: text("discount_type"), // 'percentage', 'fixed'
  discount_amount: integer("discount_amount").default(0), // discount value
  subtotal: integer("subtotal"), // before discount
  total_amount: integer("total_amount"), // final amount after discount
  order_date: timestamp("order_date").notNull(),
  sent_to_baker_at: timestamp("sent_to_baker_at"),
  production_ready_at: timestamp("production_ready_at"),
  shipped_at: timestamp("shipped_at"),
  delivered_at: timestamp("delivered_at"),
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
});

// ─── Stock Management Tables ───────────────────────────────────────────────────

export const stock = pgTable("stock", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id")
    .references(() => products.id)
    .notNull(),
  outlet_id: integer("outlet_id").references(() => outlets.id), // NULL = central warehouse
  quantity: integer("quantity").default(0).notNull(),
  min_stock: integer("min_stock").default(5), // low stock threshold
  created_at: timestamp("created_at").defaultNow().notNull(),
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
  reference_outlet_id: integer("reference_outlet_id").references(() => outlets.id), // for transfers
  notes: text("notes"),
  created_by: text("created_by"), // user id
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ─── Better Auth Tables ──────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  // Custom field for role-based access
  role: text("role").notNull().default("admin"),
  currentOutletId: integer("current_outlet_id").references(() => outlets.id),
  // Better Auth Admin Plugin fields
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

export const outletsRelations = relations(outlets, ({ many }) => ({
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  outlet: one(outlets, {
    fields: [orders.outlet_id],
    references: [outlets.id],
  }),
  items: many(orderItems),
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
