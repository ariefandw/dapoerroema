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
    const outletId = (session?.user as any)?.currentOutletId;

    const [outlets, products, orders] = await Promise.all([
        getOutlets(),
        getProducts(),
        getActiveOrders(outletId, date),
    ]);

    return (
        <OrderClientPage
            orders={orders}
            products={products}
            userRole={userRole}
            outletId={outletId}
            date={date}
        />
    );
}
