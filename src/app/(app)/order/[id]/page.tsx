import { getOrderWithDetails } from "@/app/actions";
import { requireRole } from "@/lib/auth-guard";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrderDetailClient } from "./OrderDetailClient";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await requireRole(["admin", "baker", "runner", "user"]);
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) notFound();

    const order = await getOrderWithDetails(orderId);

    const session = await auth.api.getSession({ headers: await headers() });
    const isAdmin = session?.user?.role === "admin";
    const userRole = (session?.user?.role as string) || "user";

    if (!order) notFound();

    return (
        <OrderDetailClient initialOrder={order} isAdmin={isAdmin} userRole={userRole} />
    );
}
