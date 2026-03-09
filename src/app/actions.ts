"use server";

import { db } from "@/db";
import { outlets, products, orders, orderItems, user, orderStatusLogs } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, inArray, and, sql, gte, lte } from "drizzle-orm";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkStockAvailability, deductStock, addStock, getProductStock } from "./actions/stock";

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

export async function adminCreateUser(data: { email: string; name: string; role: "admin" | "baker" | "runner" | "user"; currentOutletId?: number | null; password?: string }) {
    try {
        await auth.api.createUser({
            headers: await headers(),
            body: {
                email: data.email,
                name: data.name,
                password: data.password || "Password123!",
                role: data.role as any,
                data: {
                    currentOutletId: data.currentOutletId
                }
            }
        });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to create user:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to create user" };
    }
}

export async function toggleUserStatus(userId: string, isBanned: boolean) {
    try {
        if (isBanned) {
            await auth.api.unbanUser({
                headers: await headers(),
                body: { userId }
            });
        } else {
            await auth.api.banUser({
                headers: await headers(),
                body: { userId }
            });
        }
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle user status:", error);
        return { success: false, error: "Failed to toggle user status" };
    }
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

export async function updateProfile(data: { id: string; name: string; image: string | null }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return { success: false, error: "Not authenticated" };
        }

        // Users can only update their own profile
        if (session.user.id !== data.id) {
            return { success: false, error: "Unauthorized" };
        }

        await db.update(user)
            .set({
                name: data.name,
                image: data.image,
                updatedAt: new Date(),
            })
            .where(eq(user.id, data.id));

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to update profile:", error);
        return { success: false, error: "Failed to update profile" };
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

        // Check stock availability for all items at the outlet
        const stockIssues: Array<{ product_id: number; requested: number; available: number }> = [];
        for (const item of data.items) {
            const available = await getProductStock(item.product_id, data.outlet_id);
            if (available < item.quantity) {
                stockIssues.push({
                    product_id: item.product_id,
                    requested: item.quantity,
                    available,
                });
            }
        }

        // If there are stock issues, return error details
        if (stockIssues.length > 0) {
            const issueDetails = stockIssues.map(
                i => `Product ${i.product_id}: requested ${i.requested}, available ${i.available}`
            ).join("; ");
            return {
                success: false,
                error: `Insufficient stock: ${issueDetails}`,
                stockIssues
            };
        }

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

        // Deduct stock for each item after order is created
        for (const item of data.items) {
            try {
                await deductStock({
                    product_id: item.product_id,
                    outlet_id: data.outlet_id,
                    quantity: item.quantity,
                    notes: `Order #${data.outlet_id}`,
                });
            } catch (error) {
                console.error(`Failed to deduct stock for product ${item.product_id}:`, error);
            }
        }

        revalidatePath("/order");
        revalidatePath("/admin/master/stock");
        return { success: true };
    } catch (error) {
        console.error("Failed to create order:", error);
        return { success: false, error: "Failed to create order" };
    }
}

export async function getActiveOrders(outletId?: number | null, dateStr?: string) {
    let start: Date;
    let end: Date;

    if (dateStr) {
        // Parse the YYYY-MM-DD string in the server's local timezone
        const [year, month, day] = dateStr.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day);
        start = startOfDay(targetDate);
        end = endOfDay(targetDate);
    } else {
        // Default to today in server local time
        const now = new Date();
        start = startOfDay(now);
        end = endOfDay(now);
    }

    console.log(`[getActiveOrders] Filtering: ${start.toISOString()} to ${end.toISOString()} (outletId: ${outletId})`);

    const conditions = [
        gte(orders.order_date, start),
        lte(orders.order_date, end)
    ];

    if (outletId) {
        conditions.push(eq(orders.outlet_id, outletId));
    }

    return await db.query.orders.findMany({
        where: and(...conditions),
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


export async function updateOrderStatus(orderId: number, currentStatus: string, newStatus: string, pathname: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        const changedBy = session?.user?.id ?? null;

        // Update order status
        await db.update(orders)
            .set({ status: newStatus, updated_at: new Date() })
            .where(eq(orders.id, orderId));

        // Write to audit log
        await db.insert(orderStatusLogs).values({
            order_id: orderId,
            from_status: currentStatus,
            to_status: newStatus,
            changed_by: changedBy,
        });

        // When production is ready, add stock to warehouse (make-to-stock model)
        if (newStatus === "ready") {
            const order = await db.query.orders.findFirst({
                where: eq(orders.id, orderId),
                with: { items: true },
            });

            if (order) {
                for (const item of order.items) {
                    try {
                        await addStock({
                            product_id: item.product_id,
                            outlet_id: null,
                            quantity: item.quantity,
                            notes: `Production completed for order #${orderId}`,
                        });
                    } catch (error) {
                        console.error(`Failed to add warehouse stock for product ${item.product_id}:`, error);
                    }
                }
            }
        }

        revalidatePath(pathname);
        revalidatePath("/admin/master/stock");
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function updateRunnerLocation(lat: number, lng: number) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return;
        await db.update(user)
            .set({ last_lat: lat, last_lng: lng, last_seen_at: new Date() })
            .where(eq(user.id, session.user.id));
    } catch (error) {
        // Silent fail — location updates are best-effort
        console.error("Failed to update runner location:", error);
    }
}

/**
 * Cancel an order and return stock to the outlet
 * Can only be cancelled if not yet delivered
 */
export async function cancelOrder(orderId: number, reason?: string) {
    try {
        // Get the order with items
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                items: {
                    with: {
                        product: true,
                    },
                },
            },
        });

        if (!order) {
            return { success: false, error: "Order not found" };
        }

        // Check if order can be cancelled (not delivered)
        if (order.status === "delivered") {
            return { success: false, error: "Cannot cancel a delivered order" };
        }

        // Check if already cancelled
        if (order.status === "cancelled") {
            return { success: false, error: "Order is already cancelled" };
        }

        // Update order status to cancelled
        await db.update(orders)
            .set({
                status: "cancelled",
                updated_at: new Date(),
            })
            .where(eq(orders.id, orderId));

        // Return stock for each item
        for (const item of order.items) {
            try {
                await addStock({
                    product_id: item.product_id,
                    outlet_id: order.outlet_id,
                    quantity: item.quantity,
                    notes: reason || `Returned from cancelled order #${orderId}`,
                });
            } catch (error) {
                console.error(`Failed to return stock for product ${item.product_id}:`, error);
            }
        }

        revalidatePath("/order");
        revalidatePath("/admin/master/stock");
        return { success: true };
    } catch (error) {
        console.error("Failed to cancel order:", error);
        return { success: false, error: "Failed to cancel order" };
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
