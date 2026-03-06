import { db } from "@/db";
import { products } from "@/db/schema";
import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/migrate";

// Run migrations on first API call
let initDone = false;
async function ensureInitialized() {
    if (initDone) return;
    initDone = true;
    try {
        await runMigrations();
    } catch (e) {
        console.error("Migration failed:", e);
    }
}

export async function GET() {
    await ensureInitialized();

    try {
        const allProducts = await db.select().from(products).orderBy(products.category, products.name);
        return NextResponse.json(allProducts);
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
