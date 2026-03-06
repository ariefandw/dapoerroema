"use server";

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { checkStockAvailability, deductStock, getProductStock } from "./stock";

interface CashierOrderItem {
    product_id: number;
    quantity: number;
    price: number;
}

interface StockWarning {
    product_id: number;
    product_name?: string;
    requested: number;
    available: number;
}

interface CreateCashierOrderData {
    items: CashierOrderItem[];
    discount_type?: 'percentage' | 'fixed' | null;
    discount_amount?: number;
    payment_method: 'cash' | 'qris';
    subtotal: number;
    total_amount: number;
    force?: boolean; // Allow override if insufficient stock
}

export async function createCashierOrder(data: CreateCashierOrderData) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const outletId = session.user.currentOutletId || 1;

    // Check stock availability for all items
    const stockWarnings: StockWarning[] = [];
    const hasInsufficientStock = await Promise.all(
        data.items.map(async (item) => {
            const available = await getProductStock(item.product_id, outletId);
            const isSufficient = available >= item.quantity;
            if (!isSufficient) {
                stockWarnings.push({
                    product_id: item.product_id,
                    requested: item.quantity,
                    available,
                });
            }
            return !isSufficient;
        })
    );

    const anyInsufficientStock = hasInsufficientStock.some(Boolean);

    // If insufficient stock and not forced, throw error with details
    if (anyInsufficientStock && !data.force) {
        const warnings = stockWarnings.map(
            w => `Product ${w.product_id}: requested ${w.requested}, available ${w.available}`
        ).join("; ");
        throw new Error(`Insufficient stock: ${warnings}`);
    }

    // Build base values - use undefined for discount_type when no discount
    const hasDiscount = data.discount_type && data.discount_amount && data.discount_amount > 0;

    // Create order
    const [order] = await db.insert(orders).values({
        outlet_id: outletId,
        status: "completed",
        payment_status: "paid",
        payment_method: data.payment_method,
        discount_type: hasDiscount ? data.discount_type : undefined,
        discount_amount: hasDiscount ? data.discount_amount : 0,
        subtotal: data.subtotal,
        total_amount: data.total_amount,
        order_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
    }).returning();

    // Create order items
    if (data.items.length > 0) {
        await db.insert(orderItems).values(
            data.items.map(item => ({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
            }))
        );
    }

    // Deduct stock for each item
    for (const item of data.items) {
        try {
            await deductStock({
                product_id: item.product_id,
                outlet_id: outletId,
                quantity: item.quantity,
                notes: `Cashier order #${order.id}`,
            });
        } catch (error) {
            // Log error but don't fail the order
            console.error(`Failed to deduct stock for product ${item.product_id}:`, error);
        }
    }

    revalidatePath("/cashier");
    revalidatePath("/order");
    revalidatePath("/admin/master/stock");

    return order;
}

/**
 * Get stock levels for all products at the current outlet
 * Used for displaying stock warnings in cashier UI
 */
export async function getCashierStockLevels() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const outletId = session.user.currentOutletId || 1;
    const { getProductStock } = await import("./stock");

    // Get all products with their stock levels
    const products = await db.query.products.findMany({
        orderBy: (products, { asc }) => [asc(products.name)],
    });

    const productsWithStock = await Promise.all(
        products.map(async (product) => ({
            ...product,
            stock: await getProductStock(product.id, outletId),
        }))
    );

    return productsWithStock;
}

export async function updatePaymentStatus(orderId: number, status: 'paid' | 'pending') {
    await db.update(orders)
        .set({ payment_status: status, updated_at: new Date() })
        .where(eq(orders.id, orderId));

    revalidatePath("/order");
    revalidatePath("/cashier");

    return { success: true };
}
