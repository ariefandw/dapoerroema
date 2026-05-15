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
    
    // For Bakers, Runners, and Admins, we ignore the currentOutletId filter 
    // to ensure they see ALL orders across all outlets (Central Kitchen model)
    const filterOutletId = userRole === "user" 
        ? ((session?.user as any)?.currentOutletId || null)
        : null;

    // For Admin: if filterOutletId is null, getActiveOrders(null) will fetch all orders
    const [outlets, products, orders] = await Promise.all([
        getOutlets(),
        getProducts(),
        getActiveOrders(filterOutletId, date),
    ]);

    return (
        <OrderClientPage
            orders={orders}
            products={products}
            outlets={outlets}
            userRole={userRole}
            outletId={(session?.user as any)?.currentOutletId || null}
            date={date}
        />
    );
}
