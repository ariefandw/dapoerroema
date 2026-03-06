"use server";

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

interface CashierOrderItem {
    product_id: number;
    quantity: number;
    price: number;
}

interface CreateCashierOrderData {
    items: CashierOrderItem[];
    discount_type?: 'percentage' | 'fixed' | null;
    discount_amount?: number;
    payment_method: 'cash' | 'qris';
    subtotal: number;
    total_amount: number;
}

export async function createCashierOrder(data: CreateCashierOrderData) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const outletId = session.user.currentOutletId || 1;

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

    revalidatePath("/cashier");
    revalidatePath("/admin");

    return order;
}

export async function updatePaymentStatus(orderId: number, status: 'paid' | 'pending') {
    await db.update(orders)
        .set({ payment_status: status, updated_at: new Date() })
        .where(eq(orders.id, orderId));

    revalidatePath("/admin");
    revalidatePath("/cashier");

    return { success: true };
}
