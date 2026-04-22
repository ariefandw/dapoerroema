import { db } from "@/db";
import { stock, products, outlets } from "@/db/schema";
import { NextResponse } from "next/server";
import { sql, eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const userRole = session.user.role;
        const currentOutletId = (session.user as any).currentOutletId;

        // Build the base query
        let stockQuery = db
            .select({
                id: stock.id,
                product_id: stock.product_id,
                product_name: products.name,
                outlet_id: stock.outlet_id,
                outlet_name: outlets.name,
                quantity: stock.quantity,
                min_stock: stock.min_stock,
                category: products.category,
                product_shelf_life: products.shelf_life,
                stock_date: stock.stock_date,
            })
            .from(stock)
            .leftJoin(products, eq(stock.product_id, products.id))
            .leftJoin(outlets, eq(stock.outlet_id, outlets.id))
            .$dynamic();

        // Only "user" role is restricted to a single outlet
        if (userRole === "user") {
            // Strict filter for user role - MUST have an outlet selected
            if (currentOutletId) {
                stockQuery = stockQuery.where(eq(stock.outlet_id, currentOutletId));
            } else {
                // If non-admin has no outlet selected, they see nothing
                stockQuery = stockQuery.where(sql`1 = 0`); 
            }
        } else {
            // Admin role: if currentOutletId is null, show everything (no where clause)
            // If currentOutletId is provided, filter by it
            if (currentOutletId) {
                stockQuery = stockQuery.where(eq(stock.outlet_id, currentOutletId));
            }
        }

        const stockResult = await stockQuery.orderBy(
            sql`CASE WHEN ${stock.outlet_id} IS NULL THEN 0 ELSE ${stock.outlet_id} END`,
            products.name
        );

        const now = new Date();

        const stockWithStatus = stockResult.map((s: any) => {
            let expiredQty = 0;
            let upSellingQty = 0;
            const shelfLife = s.product_shelf_life;

            if (shelfLife && s.stock_date && s.quantity > 0) {
                const stockDateObj = new Date(s.stock_date);
                const expiryDate = new Date(stockDateObj);
                expiryDate.setDate(expiryDate.getDate() + shelfLife);

                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= 0) {
                    expiredQty = s.quantity;
                } else if (daysUntilExpiry <= Math.ceil(shelfLife * 0.3)) {
                    upSellingQty = s.quantity;
                }
            }

            return {
                ...s,
                shelf_life: shelfLife,
                location_name: s.outlet_id === null ? "Central Kitchen" : s.outlet_name,
                is_low_stock: s.quantity < (s.min_stock ?? 5),
                expired_qty: expiredQty,
                up_selling_qty: upSellingQty,
            };
        });

        return NextResponse.json(stockWithStatus);
    } catch (error) {
        console.error("Failed to fetch stock:", error);
        return NextResponse.json({ error: "Failed to fetch stock" }, { status: 500 });
    }
}
