import { db } from "@/db";
import { stock, products, outlets } from "@/db/schema";
import { NextResponse } from "next/server";
import { sql, eq } from "drizzle-orm";

export async function GET() {
    try {
        const stockQuery = await db
            .select({
                id: stock.id,
                product_id: stock.product_id,
                product_name: products.name,
                outlet_id: stock.outlet_id,
                outlet_name: outlets.name,
                quantity: stock.quantity,
                min_stock: stock.min_stock,
            })
            .from(stock)
            .leftJoin(products, eq(stock.product_id, products.id))
            .leftJoin(outlets, eq(stock.outlet_id, outlets.id))
            .orderBy(sql`CASE WHEN ${stock.outlet_id} IS NULL THEN 0 ELSE ${stock.outlet_id} END`, products.name);

        const stockWithStatus = stockQuery.map((s) => ({
            ...s,
            location_name: s.outlet_id === null ? "Central Kitchen" : s.outlet_name,
            is_low_stock: s.quantity < (s.min_stock ?? 5),
        }));

        return NextResponse.json(stockWithStatus);
    } catch (error) {
        console.error("Failed to fetch stock:", error);
        return NextResponse.json({ error: "Failed to fetch stock" }, { status: 500 });
    }
}
