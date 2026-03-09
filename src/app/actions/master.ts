"use server";
import { db } from "@/db";
import { outlets, products, brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Brand Actions ────────────────────────────────────────────────────────────

export async function upsertBrand(data: { id?: number; name: string; description?: string }) {
    if (data.id) {
        await db.update(brands)
            .set({ name: data.name, description: data.description })
            .where(eq(brands.id, data.id));
    } else {
        await db.insert(brands).values({ name: data.name, description: data.description });
    }
    revalidatePath("/admin/master/brands");
}

export async function deleteBrand(id: number) {
    try {
        await db.delete(brands).where(eq(brands.id, id));
        revalidatePath("/admin/master/brands");
        return { success: true, message: "Brand berhasil dihapus" };
    } catch (error) {
        console.error("Failed to delete brand:", error);
        return { success: false, message: "Gagal menghapus brand. Pastikan tidak ada outlet yang terkait." };
    }
}

// ─── Outlet Actions ───────────────────────────────────────────────────────────

export async function upsertOutlet(data: { id?: number; name: string; contact_info?: string; brand_id?: number | null }) {
    if (data.id) {
        await db.update(outlets)
            .set({
                name: data.name,
                contact_info: data.contact_info,
                brand_id: data.brand_id
            })
            .where(eq(outlets.id, data.id));
    } else {
        await db.insert(outlets).values({
            name: data.name,
            contact_info: data.contact_info,
            brand_id: data.brand_id
        });
    }
    revalidatePath("/admin/master/outlets");
}

export async function deleteOutlet(id: number) {
    try {
        await db.delete(outlets).where(eq(outlets.id, id));
        revalidatePath("/admin/master/outlets");
        return { success: true, message: "Outlet berhasil dihapus" };
    } catch (error) {
        console.error("Failed to delete outlet:", error);
        return { success: false, message: "Gagal menghapus outlet. Pastikan tidak ada data yang terkait." };
    }
}

// ─── Product Actions ─────────────────────────────────────────────────────────

export async function upsertProduct(data: { id?: number; name: string; category: string; base_price: number; image_url?: string | null }) {
    if (data.id) {
        await db.update(products)
            .set({ name: data.name, category: data.category, base_price: data.base_price, image_url: data.image_url })
            .where(eq(products.id, data.id));
    } else {
        await db.insert(products).values({
            name: data.name,
            category: data.category,
            base_price: data.base_price,
            image_url: data.image_url
        });
    }
    revalidatePath("/admin/master/products");
}

export async function deleteProduct(id: number) {
    try {
        await db.delete(products).where(eq(products.id, id));
        revalidatePath("/admin/master/products");
        return { success: true, message: "Produk berhasil dihapus" };
    } catch (error) {
        console.error("Failed to delete product:", error);
        return { success: false, message: "Gagal menghapus produk. Pastikan tidak ada data yang terkait." };
    }
}
