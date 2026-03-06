"use server";

import { db } from "@/db";
import { products, stockTransactions } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { addStock } from "./stock";
import { eq, desc, sql } from "drizzle-orm";

export interface ReceivingItem {
    product_id: number;
    quantity: number;
    notes?: string;
}

export interface ReceivingData {
    items: ReceivingItem[];
    supplier?: string;
    received_date?: Date;
}

/**
 * Record receiving goods from suppliers
 * Automatically adds stock to central warehouse (outlet_id = null)
 */
export async function recordReceiving(data: ReceivingData) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    try {
        // Process each received item
        for (const item of data.items) {
            // Get product details for notes
            const product = await db.query.products.findFirst({
                where: (products, { eq }) => eq(products.id, item.product_id),
            });

            const productName = product?.name || `Product ${item.product_id}`;
            const notes = data.supplier
                ? `Received from ${data.supplier}${item.notes ? `: ${item.notes}` : ""}`
                : item.notes || `Stock received`;

            // Add stock to central warehouse (outlet_id = null)
            await addStock({
                product_id: item.product_id,
                outlet_id: null, // null = central warehouse
                quantity: item.quantity,
                notes: notes,
            });
        }

        revalidatePath("/admin/master/stock");
        revalidatePath("/admin/receiving");
        return { success: true };
    } catch (error) {
        console.error("Failed to record receiving:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to record receiving"
        };
    }
}

/**
 * Get receiving history (from stock transactions with "add" type at warehouse)
 */
export async function getReceivingHistory(limit: number = 50) {
    const transactions = await db
        .select({
            id: stockTransactions.id,
            product_id: stockTransactions.product_id,
            product_name: products.name,
            quantity: stockTransactions.quantity,
            notes: stockTransactions.notes,
            created_at: stockTransactions.created_at,
        })
        .from(stockTransactions)
        .leftJoin(products, eq(stockTransactions.product_id, products.id))
        .where(sql`${stockTransactions.outlet_id} IS NULL`) // Warehouse only
        .orderBy(desc(stockTransactions.created_at))
        .limit(limit);

    // Filter only "add" transactions (receiving)
    return transactions
        .filter((t) => t.notes?.toLowerCase().includes("received") || t.notes?.toLowerCase().includes("stock"))
        .map((t) => ({
            id: t.id,
            product_name: t.product_name ?? "Unknown Product",
            quantity: t.quantity,
            notes: t.notes,
            created_at: t.created_at,
        }));
}
