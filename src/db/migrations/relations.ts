import { relations } from "drizzle-orm/relations";
import { orders, orderItems, products, outlets, user, account, session } from "./schema";

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	orderItems: many(orderItems),
	outlet: one(outlets, {
		fields: [orders.outletId],
		references: [outlets.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	orderItems: many(orderItems),
}));

export const outletsRelations = relations(outlets, ({many}) => ({
	orders: many(orders),
	users: many(user),
}));

export const userRelations = relations(user, ({one, many}) => ({
	outlet: one(outlets, {
		fields: [user.currentOutletId],
		references: [outlets.id]
	}),
	accounts: many(account),
	sessions: many(session),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));