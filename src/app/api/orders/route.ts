import { NextResponse } from "next/server";
import { getActiveOrders } from "@/app/actions";
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
        const dateStr = url.searchParams.get("date") || undefined;
        const outletId = (session.user as any).currentOutletId;
        const orders = await getActiveOrders(outletId, dateStr);

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Error fetching orders API:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
