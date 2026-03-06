import { db } from "@/db";
import { products } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const allProducts = await db.select().from(products).orderBy(products.category, products.name);
        return NextResponse.json(allProducts);
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
