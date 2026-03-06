import { pgTable, foreignKey, serial, integer, text, timestamp, unique, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const orderItems = pgTable("order_items", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	productId: integer("product_id").notNull(),
	quantity: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
]);

export const outlets = pgTable("outlets", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	contactInfo: text("contact_info"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	category: text().notNull(),
	basePrice: integer("base_price").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	imageUrl: text("image_url"),
});

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	outletId: integer("outlet_id").notNull(),
	status: text().default('pending').notNull(),
	paymentStatus: text("payment_status"),
	orderDate: timestamp("order_date", { mode: 'string' }).notNull(),
	sentToBakerAt: timestamp("sent_to_baker_at", { mode: 'string' }),
	productionReadyAt: timestamp("production_ready_at", { mode: 'string' }),
	shippedAt: timestamp("shipped_at", { mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	paymentMethod: text("payment_method"),
	discountType: text("discount_type"),
	discountAmount: integer("discount_amount").default(0),
	subtotal: integer(),
	totalAmount: integer("total_amount"),
}, (table) => [
	foreignKey({
			columns: [table.outletId],
			foreignColumns: [outlets.id],
			name: "orders_outlet_id_outlets_id_fk"
		}),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().default(false).notNull(),
	image: text(),
	role: text().default('admin').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	currentOutletId: integer("current_outlet_id"),
	banned: boolean(),
	banReason: text(),
	banExpires: timestamp({ mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.currentOutletId],
			foreignColumns: [outlets.id],
			name: "user_current_outlet_id_outlets_id_fk"
		}),
	unique("user_email_unique").on(table.email),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
});

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);
