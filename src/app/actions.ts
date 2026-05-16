"use server";

import { db } from "@/db";
import { outlets, products, orders, orderItems, user, orderStatusLogs, runnerTrail, stock, stockTransactions } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, inArray, and, sql, gte, lte, isNull } from "drizzle-orm";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { auth, Session } from "@/lib/auth";
import { headers } from "next/headers";
import { checkStockAvailability, deductStock, addStock, getProductStock } from "./actions/stock";
import { sendTelegramNotification } from "./actions/telegram";

export async function getOutlets() {
    try {
        const session = await auth.api.getSession({ headers: await headers() }) as Session | null;
        if (!session?.user) return [];

        // Admins, Bakers, and Runners see all outlets
        if (session.user.role !== "user") {
            return await db.select().from(outlets).orderBy(outlets.name);
        }

        // For 'user' role, check their permanent database state first.
        // If they are assigned "Semua Outlet" in the DB (currentOutletId is null),
        // they should ALWAYS see all outlets in the dropdown, regardless of what they are currently viewing.
        const dbUser = await db.query.user.findFirst({
            where: eq(user.id, session.user.id),
            columns: { currentOutletId: true }
        });

        // If their base assignment is null, they have global access
        if (dbUser && dbUser.currentOutletId === null) {
            return await db.select().from(outlets).orderBy(outlets.name);
        }

        // Otherwise, they are a restricted user. They can only see outlets from their brand.
        if (session.user.currentOutletId) {
            const currentOutlet = await db.query.outlets.findFirst({
                where: eq(outlets.id, session.user.currentOutletId),
            });

            if (currentOutlet?.brand_id) {
                return await db.select()
                    .from(outlets)
                    .where(eq(outlets.brand_id, currentOutlet.brand_id))
                    .orderBy(outlets.name);
            }
        }

        // Fallback
        return await db.select().from(outlets).orderBy(outlets.name);
    } catch (error) {
        console.error("Failed to get outlets:", error);
        return [];
    }
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

export async function adminCreateUser(data: { email: string; name: string; username?: string | null; role: "admin" | "baker" | "runner" | "user"; currentOutletId?: number | null; password?: string }) {
    try {
        // Check if username is already taken
        if (data.username && data.username.trim()) {
            const existingUser = await db.query.user.findFirst({
                where: (u, { eq }) => eq(u.username, data.username!.trim()),
            });

            if (existingUser) {
                return { success: false, error: "Username sudah digunakan" };
            }
        }

        await (auth.api as any).createUser({
            headers: await headers(),
            body: {
                email: data.email,
                name: data.name,
                password: data.password || "Password123",
                role: data.role as any,
                data: {
                    username: data.username?.trim() || null,
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
            await (auth.api as any).unbanUser({
                headers: await headers(),
                body: { userId }
            });
        } else {
            await (auth.api as any).banUser({
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

export async function updateUserAdmin(data: { userId: string; name: string; username?: string | null; role: string; currentOutletId?: number | null }) {
    try {
        // Check if username is already taken by another user
        if (data.username && data.username.trim()) {
            const existingUser = await db.query.user.findFirst({
                where: (u, { and, eq, ne }) => and(
                    eq(u.username, data.username!.trim()),
                    ne(u.id, data.userId)
                ),
            });

            if (existingUser) {
                return { success: false, error: "Username sudah digunakan" };
            }
        }

        await db.update(user)
            .set({
                name: data.name,
                username: data.username?.trim() || null,
                role: data.role,
                currentOutletId: data.currentOutletId,
                updatedAt: new Date(),
            })
            .where(eq(user.id, data.userId));
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { success: false, error: "Failed to update user" };
    }
}

export async function updateProfile(data: { id: string; name: string; username?: string | null; image: string | null }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        }) as Session | null;

        if (!session?.user) {
            return { success: false, error: "Not authenticated" };
        }

        // Users can only update their own profile
        if (session.user.id !== data.id) {
            return { success: false, error: "Unauthorized" };
        }

        // Check if username is already taken by another user
        if (data.username && data.username.trim()) {
            const existingUser = await db.query.user.findFirst({
                where: (u, { and, eq, ne }) => and(
                    eq(u.username, data.username!.trim()),
                    ne(u.id, data.id)
                ),
            });

            if (existingUser) {
                return { success: false, error: "Username sudah digunakan" };
            }
        }

        await db.update(user)
            .set({
                name: data.name,
                username: data.username?.trim() || null,
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
        }) as Session | null;

        if (!session?.user) {
            return { success: false, error: "Not authenticated" };
        }

        // Baker and Runner roles are locked to Dapoer Roema (all outlets)
        if (session.user.role === "baker" || session.user.role === "runner") {
            return { success: false, error: `${session.user.role === "baker" ? "Baker" : "Runner"} tidak dapat memilih outlet spesifik.` };
        }

        // If 'user' role, enforce brand restrictions
        if (session.user.role === "user") {
            // If the user is a "Semua Outlet" user (no starting outlet), 
            // they can pick ANY outlet initially.
            if (session.user.currentOutletId === null) {
                // No restriction, allow switching to targetOutlet
            } else {
                if (outletId === null) {
                    return { success: false, error: "Tipe akun anda harus memilih spesifik outlet." };
                }

                // Get current outlet brand
                const userCurrent = await db.query.user.findFirst({
                    where: eq(user.id, session.user.id),
                    with: { currentOutlet: true }
                });

                const targetOutlet = await db.query.outlets.findFirst({
                    where: eq(outlets.id, outletId)
                });

                if (!userCurrent?.currentOutlet?.brand_id || !targetOutlet?.brand_id || userCurrent.currentOutlet.brand_id !== targetOutlet.brand_id) {
                    return { success: false, error: "Anda hanya boleh memilih outlet dari brand yang sama." };
                }
            }
        }

        await db.update(user)
            .set({ currentOutletId: outletId })
            .where(eq(user.id, session.user.id));

        revalidatePath("/", "layout");
        revalidatePath("/order");
        revalidatePath("/dashboard");
        return { success: true, outletId };
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
        const session = await auth.api.getSession({ headers: await headers() }) as Session | null;
        const userRole = session?.user?.role;

        if (!userRole || !["admin", "user"].includes(userRole as string)) {
            return { success: false, error: "Unauthorized: Anda tidak memiliki akses untuk membuat order." };
        }

        const orderDate = new Date();

        // Check stock availability for all items at the outlet
        const stockIssues: Array<{ product_id: number; requested: number; available: number }> = [];
        for (const item of data.items) {
            const available = await getProductStock(item.product_id, null);
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

        // Fetch outlet and brand info
        const outlet = await db.query.outlets.findFirst({
            where: eq(outlets.id, data.outlet_id),
            with: { brand: true }
        });

        if (!outlet) throw new Error("Outlet not found");

        // Fetch brand prices overrides
        const brandPricesMap = new Map<number, number>();
        if (outlet.brand_id) {
            const overrides = await db.query.brandProducts.findMany({
                where: (bp, { eq }) => eq(bp.brand_id, outlet.brand_id!)
            });
            overrides.forEach(o => brandPricesMap.set(o.product_id, o.price));
        }

        // Fetch products to get base prices
        const productIds = data.items.map(i => i.product_id);
        const productsList = await db.query.products.findMany({
            where: inArray(products.id, productIds)
        });
        const basePricesMap = new Map(productsList.map(p => [p.id, p.base_price]));

        // Calculate subtotal and items with resolved prices
        let subtotal = 0;
        const resolvedItems = data.items.map(item => {
            const price = brandPricesMap.get(item.product_id) ?? basePricesMap.get(item.product_id) ?? 0;
            subtotal += price * item.quantity;
            return {
                ...item,
                unit_price: price
            };
        });

        // Create the order and deduct stock in a single transaction to prevent race conditions
        let createdOrderId: number | null = null;
        await db.transaction(async (tx) => {
            const [newOrder] = await tx
                .insert(orders)
                .values({
                    outlet_id: data.outlet_id,
                    order_date: orderDate,
                    status: "pending",
                    subtotal: subtotal,
                    total_amount: subtotal, // Assuming no discount initially
                })
                .returning();

            createdOrderId = newOrder.id;

            if (resolvedItems.length > 0) {
                const itemsToInsert = resolvedItems.map((item) => ({
                    order_id: newOrder.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                }));

                await tx.insert(orderItems).values(itemsToInsert);
            }

            // Deduct stock safely within the same transaction
            for (const item of data.items) {
                const existingStock = await tx.query.stock.findFirst({
                    where: (s, { eq, and }) => and(
                        eq(s.product_id, item.product_id),
                        isNull(s.outlet_id)
                    )
                });

                if (!existingStock || existingStock.quantity < item.quantity) {
                    throw new Error(`Insufficient stock during final check for product ${item.product_id}`);
                }

                const newQuantity = existingStock.quantity - item.quantity;

                await tx.update(stock)
                    .set({ quantity: newQuantity, updated_at: new Date() })
                    .where(eq(stock.id, existingStock.id));

                await tx.insert(stockTransactions).values({
                    product_id: item.product_id,
                    outlet_id: null,
                    transaction_type: "deduct",
                    quantity: item.quantity,
                    notes: `Order #${newOrder.id}`,
                    created_by: session?.user?.id ?? null,
                });
            }
        });

        revalidatePath("/order");
        revalidatePath("/admin/master/stock");
        return { success: true, orderId: createdOrderId };
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
            runner: true,
            items: {
                with: {
                    product: true,
                },
            },
        },
        orderBy: (orders, { desc }) => [desc(orders.order_date)],
    });
}


export async function updateOrderStatus(
    orderId: number,
    currentStatus: string,
    newStatus: string,
    pathname: string,
    deliveryData?: { photoUrl: string; signatureUrl: string }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() }) as Session | null;
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const userRole = session.user.role as string;
        const changedBy = session.user.id;

        // Strict role validation based on allowed statuses
        if (userRole !== "admin") {
            if (userRole === "user") {
                if (!["pending", "cancelled"].includes(newStatus)) {
                    return { success: false, error: "Unauthorized: User cannot set this status." };
                }
            } else if (userRole === "baker") {
                if (!["pending", "accepted", "in_production", "ready"].includes(newStatus)) {
                    return { success: false, error: "Unauthorized: Baker cannot set this status." };
                }
            } else if (userRole === "runner") {
                if (!["ready", "shipping", "delivered"].includes(newStatus)) {
                    return { success: false, error: "Unauthorized: Runner cannot set this status." };
                }
            } else {
                return { success: false, error: "Unauthorized: Invalid role." };
            }
        }

        // Update order status and delivery proof if provided
        // When status changes to "shipping", assign the runner
        const runnerId = (newStatus === "shipping" && userRole === "runner") ? changedBy : null;
        await db.update(orders)
            .set({
                status: newStatus,
                updated_at: new Date(),
                ...(runnerId && { runner_id: runnerId }),
                ...(deliveryData && {
                    delivery_photo_url: deliveryData.photoUrl,
                    delivery_signature_url: deliveryData.signatureUrl
                })
            })
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
                with: { items: true, outlet: true },
            });

            if (order) {
                for (const item of order.items) {
                    try {
                        await addStock({
                            product_id: item.product_id,
                            outlet_id: null, // Add to central kitchen
                            quantity: item.quantity,
                            notes: `Production completed for order #${orderId}`,
                        });
                    } catch (error) {
                        console.error(`Failed to add warehouse stock for product ${item.product_id}:`, error);
                    }
                }
            }
        }

        // When shipping, the runner is on the way. Status update only.
        // When delivered, the stock is added to the destination outlet.
        if (newStatus === "delivered") {
            const order = await db.query.orders.findFirst({
                where: eq(orders.id, orderId),
                with: { items: true },
            });

            if (order && order.outlet_id !== null) {
                const { addStock } = await import("./actions/stock");
                for (const item of order.items) {
                    try {
                        await addStock({
                            product_id: item.product_id,
                            outlet_id: order.outlet_id,
                            quantity: item.quantity,
                            notes: `Delivered order #${orderId}`,
                        });
                    } catch (error) {
                        console.error(`Failed to add stock for product ${item.product_id} upon delivery:`, error);
                    }
                }
            }
        }

        // Send Telegram Notification for all status changes
        const notifyOrder = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: { 
                outlet: true,
                items: {
                    with: { product: true }
                }
            },
        });

        if (notifyOrder) {
            const statusEmoji: Record<string, string> = {
                'pending': '⏳',
                'accepted': '✅',
                'in_production': '👨‍🍳',
                'ready': '📦',
                'shipping': '🚚',
                'delivered': '🏠',
                'cancelled': '❌'
            };

            const itemsList = notifyOrder.items
                .map(item => `• ${item.product.name} x${item.quantity}`)
                .join('\n');

            const message = `<b>${statusEmoji[newStatus] || '🔔'} Update Status Order</b>\n\n` +
                `Order: <b>#${orderId.toString().padStart(3, '0')}</b>\n` +
                `Status: <b>${newStatus.toUpperCase()}</b>\n` +
                `Outlet: <b>${notifyOrder.outlet?.name || 'Unknown'}</b>\n\n` +
                `<b>Daftar Produk:</b>\n${itemsList}\n\n` +
                `<i>Update dilakukan oleh sistem.</i>`;

            await sendTelegramNotification(message).catch(console.error);
        }

        revalidatePath(pathname);
        revalidatePath("/admin/master/stock");
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function getOrderWithDetails(orderId: number) {
    try {
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                outlet: {
                    with: {
                        brand: true
                    }
                },
                runner: true,
                items: {
                    with: {
                        product: true,
                    },
                },
                statusLogs: {
                    orderBy: (logs, { asc }) => [asc(logs.created_at)],
                    // Note: Drizzle-ORM findFirst 'with' logs join User is tricky with
                    // current version if not mapped in relations.
                    // I will fetch logs separately if needed or rely on ID mapping.
                },
                trails: {
                    orderBy: (trails, { asc }) => [asc(trails.created_at)],
                },
            },
        });

        if (!order) return null;

        // Fetch user names for status logs manually to ensure precision
        const logUserIds = order.statusLogs.map(l => l.changed_by).filter(Boolean) as string[];
        const users = logUserIds.length > 0
            ? await db.query.user.findMany({ where: inArray(user.id, logUserIds) })
            : [];
        const userMap = new Map(users.map(u => [u.id, u.name]));

        const enrichedLogs = order.statusLogs.map(log => ({
            ...log,
            userName: log.changed_by ? userMap.get(log.changed_by) : "Sistem"
        }));

        const session = await auth.api.getSession({ headers: await headers() }) as Session | null;

        const resultOrder = {
            ...order,
            statusLogs: enrichedLogs,
        };

        if (session?.user?.role !== "admin") {
            resultOrder.items = resultOrder.items.map((item) => {
                if (item.product) {
                    // @ts-ignore
                    item.product.base_price = null;
                }
                return item;
            });
        }

        return resultOrder;
    } catch (error) {
        console.error("Failed to fetch order details:", error);
        return null;
    }
}

export async function updateRunnerLocation(lat: number, lng: number) {
    try {
        const session = await auth.api.getSession({ headers: await headers() }) as Session | null;
        const userId = session?.user?.id;
        if (!userId) return;

        // 1. Update the user's current location (latest snapshot)
        await db.update(user)
            .set({ last_lat: lat, last_lng: lng, last_seen_at: new Date() })
            .where(eq(user.id, userId));

        // 2. Check if the runner has an active delivery (shipping status)
        // We only record the trail if they are currently delivering something
        // Find the order assigned to this runner
        const activeOrder = await db.query.orders.findFirst({
            where: (o, { eq, and }) => and(
                eq(o.status, "shipping"),
                eq(o.runner_id, userId)
            )
        });

        if (activeOrder) {
            // 3. Record the trail with distance throttling
            const lastTrail = await db.query.runnerTrail.findFirst({
                where: eq(runnerTrail.user_id, userId),
                orderBy: (trails, { desc }) => [desc(trails.created_at)]
            });

            let shouldInsert = true;
            if (lastTrail) {
                // Basic distance calculation (Pythagorean theorem on coordinates for rough short distances)
                // Note: Not perfectly accurate for spherical earth, but efficient for small distances
                const dLat = (lat - lastTrail.lat) * 111000; // rough meters per degree lat
                const dLng = (lng - lastTrail.lng) * 111000 * Math.cos(lat * Math.PI / 180);
                const distanceMeters = Math.sqrt(dLat * dLat + dLng * dLng);

                // Only insert if moved more than 20 meters to prevent DB bloat
                if (distanceMeters < 20) {
                    shouldInsert = false;
                }
            }

            if (shouldInsert) {
                await db.insert(runnerTrail).values({
                    user_id: userId,
                    order_id: activeOrder.id,
                    lat,
                    lng,
                });
            }
        }
    } catch (error) {
        // Silent fail — location updates are best-effort
        console.error("Failed to update runner location:", error);
    }
}

export async function getRunnerLocations() {
    // 1. Get all runners who have been seen in the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const activeRunners = await db.query.user.findMany({
        where: (u, { eq, and, gte }) => and(
            eq(u.role, "runner"),
            gte(u.last_seen_at, twoHoursAgo)
        ),
    });

    // 2. Get trails for active shipping orders
    const activeTrails = await db.query.runnerTrail.findMany({
        where: (t, { gte }) => gte(t.created_at, twoHoursAgo),
        orderBy: (t, { asc }) => [asc(t.created_at)],
    });

    return {
        runners: activeRunners,
        trails: activeTrails
    };
}

/**
 * Cancel an order and return stock to the outlet
 * Can only be cancelled if not yet delivered
 */
export async function cancelOrder(orderId: number, reason?: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() }) as Session | null;
        const userRole = session?.user?.role as string;

        if (!session?.user || !["admin", "user"].includes(userRole)) {
            return { success: false, error: "Unauthorized: You cannot cancel orders." };
        }

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

        await db.transaction(async (tx) => {
            // Update order status to cancelled
            await tx.update(orders)
                .set({
                    status: "cancelled",
                    updated_at: new Date(),
                })
                .where(eq(orders.id, orderId));

            // Return stock for each item
            for (const item of order.items) {
                const existingStock = await tx.query.stock.findFirst({
                    where: (s, { eq, and }) => and(
                        eq(s.product_id, item.product_id),
                        isNull(s.outlet_id)
                    )
                });

                if (existingStock) {
                    const newQuantity = existingStock.quantity + item.quantity;
                    await tx.update(stock)
                        .set({ quantity: newQuantity, updated_at: new Date() })
                        .where(eq(stock.id, existingStock.id));
                } else {
                    await tx.insert(stock).values({
                        product_id: item.product_id,
                        outlet_id: null,
                        quantity: item.quantity,
                        min_stock: 5,
                    });
                }

                await tx.insert(stockTransactions).values({
                    product_id: item.product_id,
                    outlet_id: null,
                    transaction_type: "add",
                    quantity: item.quantity,
                    notes: reason || `Returned from cancelled order #${orderId}`,
                    created_by: session?.user?.id ?? null,
                });
            }
        });

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
        SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total
        FROM order_items oi
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

export async function seedDatabase(isCleanupOnly = false) {
    try {
        const { runSeed } = await import("@/db/seed");
        return await runSeed(isCleanupOnly);
    } catch (error) {
        console.error("Failed to seed database:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to seed database" };
    }
}
