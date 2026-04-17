"use server";

import { db } from "@/db";
import { orders, orderItems, stock, stockTransactions, products } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, inArray, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function updateOrderItems(orderId: number, newItems: { product_id: number; quantity: number }[]) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        const userRole = session?.user?.role;
        const userId = session?.user?.id;

        if (!userRole || !["admin", "user", "baker"].includes(userRole as string)) {
            return { success: false, error: "Unauthorized" };
        }

        const existingOrder = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: { outlet: true, items: true }
        });

        if (!existingOrder) {
            return { success: false, error: "Order not found" };
        }

        // Only admins can edit non-pending orders (e.g. for correcting mistakes)
        // User/Baker can only edit if order is pending
        if (userRole !== "admin" && existingOrder.status !== "pending") {
            return { success: false, error: "Can only edit pending orders" };
        }

        const outletId = existingOrder.outlet_id;

        // Complex operation: Need to calculate differences to adjust stock
        // For simplicity: If it's pending, we don't adjust stock because stock is deducted upon creation
        // Wait, stock is deducted on creation in my system.
        // So we need to return old stock, then deduct new stock.

        await db.transaction(async (tx) => {
            // 1. Revert previous stock deductions
            for (const item of existingOrder.items) {
                const s = await tx.query.stock.findFirst({
                    where: (st, { eq, and }) => and(
                        eq(st.product_id, item.product_id),
                        isNull(st.outlet_id)
                    )
                });

                if (s) {
                    await tx.update(stock)
                        .set({ quantity: s.quantity + item.quantity })
                        .where(eq(stock.id, s.id));

                    await tx.insert(stockTransactions).values({
                        product_id: item.product_id,
                        outlet_id: null,
                        transaction_type: "revert_edit",
                        quantity: item.quantity,
                        notes: `Revert Order #${orderId} for edit`,
                        created_by: userId || null,
                    });
                }
            }

            // 2. Delete old items
            await tx.delete(orderItems).where(eq(orderItems.order_id, orderId));

            // 3. Insert new items and deduct new stock
            let newSubtotal = 0;

            for (const item of newItems) {
                // Determine price logic (simplified for now, ideally fetch brand override or base price again)
                // For this quick edit, we'll try to find the product base_price
                const product = await tx.query.products.findFirst({ where: eq(products.id, item.product_id) });
                const unitPrice = product ? product.base_price : 0;
                newSubtotal += unitPrice * item.quantity;

                await tx.insert(orderItems).values({
                    order_id: orderId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: unitPrice,
                });

                // Deduct new stock
                const s = await tx.query.stock.findFirst({
                    where: (st, { eq, and }) => and(
                        eq(st.product_id, item.product_id),
                        isNull(st.outlet_id)
                    )
                });

                if (!s || s.quantity < item.quantity) {
                    throw new Error(`Stok tidak mencukupi untuk produk ID ${item.product_id}`);
                }

                await tx.update(stock)
                    .set({ quantity: s.quantity - item.quantity })
                    .where(eq(stock.id, s.id));

                await tx.insert(stockTransactions).values({
                    product_id: item.product_id,
                    outlet_id: null,
                    transaction_type: "deduct_edit",
                    quantity: item.quantity,
                    notes: `Edit Order #${orderId}`,
                    created_by: userId || null,
                });
            }

            // 4. Update order total
            await tx.update(orders)
                .set({
                    subtotal: newSubtotal,
                    total_amount: newSubtotal,
                    updated_at: new Date()
                })
                .where(eq(orders.id, orderId));
        });

        revalidatePath("/order");
        revalidatePath(`/order/${orderId}`);
        revalidatePath("/admin/master/stock");

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update order items:", error);
        return { success: false, error: error.message || "Gagal memperbarui order" };
    }
}
