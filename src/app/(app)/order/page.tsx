import { getOutlets, getProducts, getActiveOrders } from "@/app/actions";
import { requireRole } from "@/lib/auth-guard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrderClientPage } from "./OrderClientPage";

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    await requireRole(["admin", "baker", "runner", "user"]);
    const { date } = await searchParams;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const userRole: string = (session?.user as any)?.role ?? "admin";
    const currentOutletId = (session?.user as any)?.currentOutletId || null;

    // For Admin: if currentOutletId is null, getActiveOrders(null) will fetch all orders
    // For others: if null, it will be handled by the action logic
    const [outlets, products, orders] = await Promise.all([
        getOutlets(),
        getProducts(),
        getActiveOrders(currentOutletId, date),
    ]);

    return (
        <OrderClientPage
            orders={orders}
            products={products}
            userRole={userRole}
            outletId={currentOutletId}
            date={date}
        />
    );
}
