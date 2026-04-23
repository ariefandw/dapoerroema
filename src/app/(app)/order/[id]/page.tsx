import { getOrderWithDetails } from "@/app/actions";
import { auth, Session } from "@/lib/auth";
import { headers } from "next/headers";
import { OrderDetailClient } from "./OrderDetailClient";
import { notFound, redirect } from "next/navigation";
import { differenceInHours } from "date-fns";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) notFound();

    const order = await getOrderWithDetails(orderId);

    if (!order) notFound();

    // Check auth
    const session = await auth.api.getSession({
        headers: await headers(),
    }) as Session | null;

    const userRole = session?.user?.role || "user";
    // Allow admin, baker, runner, and 'user' role
    const isAuthorizedRole = ["admin", "baker", "runner", "user"].includes(userRole);
    
    // Public access rule: less than 24 hours old (for guests or others)
    const orderAgeHours = differenceInHours(new Date(), new Date(order.order_date));
    const isPubliclyViewable = orderAgeHours < 24;

    if (!isAuthorizedRole && !isPubliclyViewable) {
        if (!session) {
            redirect("/login");
        }
        notFound();
    }

    return (
        <OrderDetailClient 
            initialOrder={order} 
            isAdmin={userRole === "admin"} 
            userRole={userRole} 
        />
    );
}
