import { getBakerItems } from "@/app/actions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/app/actions";
import { requireRole } from "@/lib/auth-guard";
import { PageContainer } from "@/components/PageContainer";

export default async function BakerPage() {
    await requireRole(["baker", "admin"]);
    const orders = await getBakerItems();

    // Aggregate items by product name, so baker sees total quantities needed.
    // E.g., 30x Soft Sourdough Keju, 15x Garlic Bread
    const aggregatedItems: Record<string, number> = {};

    orders.forEach((order) => {
        order.items.forEach((item: any) => {
            const productName = item.product.name;
            aggregatedItems[productName] = (aggregatedItems[productName] || 0) + item.quantity;
        });
    });

    return (
        <PageContainer>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Baker Dashboard</h1>
                <p className="text-muted-foreground">Production list and active baking queue.</p>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No orders are currently waiting for production.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* Top summary card summarizing exactly what needs to be baked in total */}
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle>Master Production List</CardTitle>
                            <CardDescription>Total quantities to bake across all active orders right now.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(aggregatedItems).map(([productName, quantity]) => (
                                    <div key={productName} className="p-4 bg-background rounded-lg shadow-sm border">
                                        <div className="text-3xl font-black mb-1">{quantity}x</div>
                                        <div className="text-sm font-medium text-muted-foreground">{productName}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Individual order breakdown to mark as ready */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold tracking-tight">Order Breakdown</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orders.map((order) => (
                                <Card key={order.id} className="flex flex-col">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">{order.outlet.name}</CardTitle>
                                        <CardDescription>Order #{order.id}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <ul className="space-y-2 mb-6">
                                            {order.items.map((item: any) => (
                                                <li key={item.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                                                    <span className="font-medium">{item.product.name}</span>
                                                    <span className="font-bold text-lg">{item.quantity}x</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <form action={async () => {
                                            "use server";
                                            await updateOrderStatus(order.id, order.status, "Production Ready", "/baker");
                                        }} className="mt-auto">
                                            <Button type="submit" className="w-full" size="lg">
                                                Mark Production Ready
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
