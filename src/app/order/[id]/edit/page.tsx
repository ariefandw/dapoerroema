import { getOrderWithDetails, getProducts } from "@/app/actions";
import { PageContainer } from "@/components/PageContainer";
import { requireRole } from "@/lib/auth-guard";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { EditOrderClientPage } from "./EditOrderClientPage";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
    await requireRole(["admin", "user", "baker"]);
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) notFound();

    const order = await getOrderWithDetails(orderId);

    if (!order) notFound();

    const session = await auth.api.getSession({ headers: await headers() });
    const userRole = session?.user?.role;

    // Authorization check
    if (userRole !== "admin" && order.status !== "pending") {
        // user and baker can only edit pending orders
        notFound();
    }

    const products = await getProducts();

    return (
        <EditOrderClientPage
            order={order}
            products={products}
            userRole={userRole}
        />
    );
}
