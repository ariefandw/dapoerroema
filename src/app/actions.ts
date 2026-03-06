"use server";

import { db } from "@/db";
import { outlets, products, orders, orderItems, user } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, inArray, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getOutlets() {
    return await db.select().from(outlets).orderBy(outlets.name);
}

export async function getProducts() {
    return await db.select().from(products).orderBy(products.category, products.name);
}

export async function getUsers() {
    return await db.query.user.findMany({
        with: {
            currentOutlet: true
        },
        orderBy: (user, { asc }) => [asc(user.name)],
    });
}

export async function updateUser(userId: string, data: { role?: string; currentOutletId?: number | null }) {
    try {
        await db.update(user)
            .set(data)
            .where(eq(user.id, userId));
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { success: false, error: "Failed to update user" };
    }
}

export async function updateCurrentOutlet(outletId: number | null) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return { success: false, error: "Not authenticated" };
        }

        await db.update(user)
            .set({ currentOutletId: outletId })
            .where(eq(user.id, session.user.id));

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to update current outlet:", error);
        return { success: false, error: "Failed to update current outlet" };
    }
}

type NewOrderParams = {
    outlet_id: number;
    items: { product_id: number; quantity: number }[];
};

export async function createOrder(data: NewOrderParams) {
    try {
        const orderDate = new Date();

        // Create the order using transaction
        await db.transaction(async (tx) => {
            const [newOrder] = await tx
                .insert(orders)
                .values({
                    outlet_id: data.outlet_id,
                    order_date: orderDate,
                    status: "pending",
                })
                .returning();

            if (data.items.length > 0) {
                const itemsToInsert = data.items.map((item) => ({
                    order_id: newOrder.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                }));

                await tx.insert(orderItems).values(itemsToInsert);
            }
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Failed to create order:", error);
        return { success: false, error: "Failed to create order" };
    }
}

export async function getActiveOrders(outletId?: number | null) {
    return await db.query.orders.findMany({
        where: outletId ? eq(orders.outlet_id, outletId) : undefined,
        with: {
            outlet: true,
            items: {
                with: {
                    product: true,
                },
            },
        },
        orderBy: (orders, { desc }) => [desc(orders.order_date)],
    });
}

export async function getBakerItems(outletId?: number | null) {
    // We want order items where the order status is pending, accepted, or in_production
    const where = [inArray(orders.status, ["pending", "accepted", "in_production"])];
    if (outletId) where.push(eq(orders.outlet_id, outletId));

    const relevantOrders = await db.query.orders.findMany({
        where: and(...where),
        with: {
            items: {
                with: {
                    product: true,
                },
            },
            outlet: true,
        },
        orderBy: (orders, { asc }) => [asc(orders.order_date)],
    });

    return relevantOrders;
}

export async function getDriverOrders(outletId?: number | null) {
    // Deliveries that are ready or shipping
    const where = [inArray(orders.status, ["ready", "shipping"])];
    if (outletId) where.push(eq(orders.outlet_id, outletId));

    const relevantOrders = await db.query.orders.findMany({
        where: and(...where),
        with: {
            outlet: true,
            items: {
                with: {
                    product: true,
                },
            },
        },
        orderBy: (orders, { asc }) => [asc(orders.order_date)],
    });

    return relevantOrders;
}

export async function updateOrderStatus(orderId: number, currentStatus: string, newStatus: string, pathname: string) {
    try {
        const timestampMap: Record<string, keyof typeof orders.$inferSelect> = {
            "accepted": "sent_to_baker_at",
            "ready": "production_ready_at",
            "shipping": "shipped_at",
            "delivered": "delivered_at",
        };

        const updateData: Partial<typeof orders.$inferInsert> = { status: newStatus };

        if (timestampMap[newStatus]) {
            const field = timestampMap[newStatus] as any; // Drizzle needs a bit of help with dynamic keys here
            (updateData as any)[field] = new Date();
        }

        await db.update(orders)
            .set(updateData)
            .where(
                eq(orders.id, orderId)
            );

        revalidatePath(pathname);
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function getAnalytics(outletId?: number | null) {
    const pool = (db as any).$client;

    const whereClause = outletId ? `WHERE outlet_id = ${outletId}` : "";
    const joinWhereClause = outletId ? `AND o.outlet_id = ${outletId}` : "";

    // KPIs
    const totalOrdersRes = await pool.query(`SELECT COUNT(*) AS total FROM orders ${whereClause}`);
    const totalOrders = parseInt(totalOrdersRes.rows[0].total);

    const totalDeliveredRes = await pool.query(`SELECT COUNT(*) AS total FROM orders WHERE status = 'delivered' ${outletId ? `AND outlet_id = ${outletId}` : ""}`);
    const totalDelivered = parseInt(totalDeliveredRes.rows[0].total);

    const revenueRes = await pool.query(`
        SELECT COALESCE(SUM(oi.quantity * p.base_price), 0) AS total
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'delivered' ${joinWhereClause}
    `);
    const totalRevenue = parseInt(revenueRes.rows[0].total);

    // Top products by total quantity
    const topProductsRes = await pool.query(`
        SELECT p.name, SUM(oi.quantity) AS total_qty
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        ${outletId ? `WHERE o.outlet_id = ${outletId}` : ""}
        GROUP BY p.name
        ORDER BY total_qty DESC
        LIMIT 10
    `);
    const topProducts = topProductsRes.rows.map((r: any) => ({
        name: r.name as string,
        quantity: parseInt(r.total_qty),
    }));

    // Orders by outlet
    const ordersByOutletRes = await pool.query(`
        SELECT o2.name AS outlet, COUNT(o.id) AS order_count
        FROM orders o
        JOIN outlets o2 ON o.outlet_id = o2.id
        ${outletId ? `WHERE o.outlet_id = ${outletId}` : ""}
        GROUP BY o2.name
        ORDER BY order_count DESC
    `);
    const ordersByOutlet = ordersByOutletRes.rows.map((r: any) => ({
        name: r.outlet as string,
        orders: parseInt(r.order_count),
    }));

    // Order volume by day (last 30 days)
    const volumeByDayRes = await pool.query(`
        SELECT DATE(order_date) AS day, COUNT(*) AS total
        FROM orders
        WHERE order_date >= NOW() - INTERVAL '30 days' ${outletId ? `AND outlet_id = ${outletId}` : ""}
        GROUP BY day
        ORDER BY day ASC
    `);
    const volumeByDay = volumeByDayRes.rows.map((r: any) => ({
        day: r.day.toISOString().slice(0, 10),
        orders: parseInt(r.total),
    }));

    // Status distribution
    const statusDistRes = await pool.query(`
        SELECT status, COUNT(*) AS total FROM orders ${whereClause} GROUP BY status
    `);
    const statusDist = statusDistRes.rows.map((r: any) => ({
        status: r.status as string,
        count: parseInt(r.total),
    }));

    return { totalOrders, totalDelivered, totalRevenue, topProducts, ordersByOutlet, volumeByDay, statusDist };
}
