import { getOutlets, getProducts, getActiveOrders } from "@/app/actions";
import { CreateOrderForm } from "@/components/CreateOrderForm";
import { OrdersTable } from "@/components/OrdersTable";
import { requireRole } from "@/lib/auth-guard";
import { PageContainer } from "@/components/PageContainer";

export default async function AdminPage() {
    await requireRole(["admin"]);
    const [outlets, products, orders] = await Promise.all([
        getOutlets(),
        getProducts(),
        getActiveOrders(),
    ]);

    return (
        <PageContainer className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage bakery intake and track active orders.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Side: Order Intake Form */}
                <div className="lg:col-span-1">
                    <CreateOrderForm outlets={outlets} products={products} />
                </div>

                {/* Right Side: Active Orders */}
                <div className="lg:col-span-2">
                    <OrdersTable orders={orders} />
                </div>
            </div>
        </PageContainer>
    );
}
