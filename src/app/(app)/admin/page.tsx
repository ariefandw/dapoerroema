import { getOutlets, getProducts, getActiveOrders } from "@/app/actions";
import { CreateOrderForm } from "@/components/CreateOrderForm";
import { OrdersTable } from "@/components/OrdersTable";
import { requireRole } from "@/lib/auth-guard";
import { PageContainer } from "@/components/PageContainer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    await requireRole(["admin"]);
    const { date } = await searchParams;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const outletId = (session?.user as any)?.currentOutletId;

    const [outlets, products, orders] = await Promise.all([
        getOutlets(),
        getProducts(),
        getActiveOrders(outletId, date),
    ]);

    return (
        <PageContainer className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pesanan</h1>
                <p className="text-muted-foreground">Kelola penerimaan roti dan lacak order aktif.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Side: Order Intake Form */}
                <div className="lg:col-span-1">
                    <CreateOrderForm outlets={outlets} products={products} />
                </div>

                {/* Right Side: Active Orders */}
                <div className="lg:col-span-2">
                    <OrdersTable orders={orders} currentDate={date} />
                </div>
            </div>
        </PageContainer>
    );
}
