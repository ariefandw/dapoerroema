import { getDriverOrders, updateOrderStatus } from "@/app/actions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guard";
import { PageContainer } from "@/components/PageContainer";

export default async function DriverPage() {
    await requireRole(["driver", "admin"]);
    const orders = await getDriverOrders();

    return (
        <PageContainer>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Driver Dashboard</h1>
                <p className="text-muted-foreground">Active delivery routes and order handoffs.</p>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No orders are currently ready for delivery or out for shipping.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders.map((order) => (
                        <Card key={order.id} className="flex flex-col relative overflow-hidden">
                            {/* Status indicator strip at top */}
                            <div
                                className={`h-2 w-full absolute top-0 left-0 ${order.status === "Shipped" ? "bg-amber-500" : "bg-blue-500"
                                    }`}
                            />

                            <CardHeader className="pt-6 pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{order.outlet.name}</CardTitle>
                                        <CardDescription>Order #{order.id}</CardDescription>
                                    </div>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${order.status === "Shipped" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Delivery Payload:</h3>
                                    <ul className="space-y-1">
                                        {order.items.map((item: any) => (
                                            <li key={item.id} className="text-sm">
                                                <span className="font-bold mr-2">{item.quantity}x</span>
                                                {item.product.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-auto pt-4 border-t flex gap-2">
                                    {order.status === "Production Ready" ? (
                                        <form action={async () => {
                                            "use server";
                                            await updateOrderStatus(order.id, order.status, "Shipped", "/driver");
                                        }} className="w-full">
                                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                                                Mark Out For Delivery
                                            </Button>
                                        </form>
                                    ) : order.status === "Shipped" ? (
                                        <form action={async () => {
                                            "use server";
                                            await updateOrderStatus(order.id, order.status, "Delivered", "/driver");
                                        }} className="w-full">
                                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                                                Confirm Delivery
                                            </Button>
                                        </form>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </PageContainer>
    );
}
