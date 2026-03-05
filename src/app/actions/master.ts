"use server";
import { db } from "@/db";
import { outlets, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Outlet Actions ──────────────────────────────────────────────────────────

export async function upsertOutlet(data: { id?: number; name: string; contact_info?: string }) {
    if (data.id) {
        await db.update(outlets)
            .set({ name: data.name, contact_info: data.contact_info })
            .where(eq(outlets.id, data.id));
    } else {
        await db.insert(outlets).values({
            name: data.name,
            contact_info: data.contact_info
        });
    }
    revalidatePath("/admin/master/outlets");
}

export async function deleteOutlet(id: number) {
    await db.delete(outlets).where(eq(outlets.id, id));
    revalidatePath("/admin/master/outlets");
}

// ─── Product Actions ─────────────────────────────────────────────────────────

export async function upsertProduct(data: { id?: number; name: string; category: string; base_price: number }) {
    if (data.id) {
        await db.update(products)
            .set({ name: data.name, category: data.category, base_price: data.base_price })
            .where(eq(products.id, data.id));
    } else {
        await db.insert(products).values({
            name: data.name,
            category: data.category,
            base_price: data.base_price
        });
    }
    revalidatePath("/admin/master/products");
}

export async function deleteProduct(id: number) {
    await db.delete(products).where(eq(products.id, id));
    revalidatePath("/admin/master/products");
}
